/**
 * Check images without a link to its description
 *
 * @author: Helder (https://github.com/he7d3r)
 * @license: CC BY-SA 3.0 <https://creativecommons.org/licenses/by-sa/3.0/>
 */
( function ( mw, $ ) {
	'use strict';

	var commonsApi, $content;

	function showInfo( info ) {
		var $result = $( '#img-checker-info' ).empty();
		if ( !$( '#img-checker-info' ).length ) {
			$result = $( '<div id="img-checker-info">' ).css( {
				border: '1px solid gray',
				padding: '0.5em'
			} );
			$content.prepend( $result );
		}
		$result.append( info );
		$.removeSpinner( 'check-cats' );
	}

	function getList( images ) {
		var colors = {
				valid: '#060',
				invalid: '#c96800',
				missing: '#A00',
				unknown: '#0645AD'
			},
			$list = $( '<ol>' );

		$.each( images, function ( img ) {
			$list.append(
				$( '<li>' ).append(
					$( '<a>' )
						.attr( 'href', mw.util.getUrl( 'commons:' + img ) )
						.css( 'color', colors[ images[ img ] ] )
						.text( img )
				)
			);
		} );
		return $list;
	}

	function checkIfAttributionIsRequired( images ) {
		var imgList = Object.keys( images ),
			curPos = 0,
			batchSize = 50, // This is the current API limit?
		doCheck = function ( pos ) {
			commonsApi.get( {
				prop: 'imageinfo',
				iiprop: 'extmetadata',
				iilimit: 10,
				indexpageids: true,
				titles: imgList.slice( pos, pos + batchSize ).join( '|' )
			} ).done( function ( data ) {
				var i, j, img, imgCats, num, r,
					map = function ( c ) {
						return c.title;
					};
				num = ( data.query && data.query.pageids && data.query.pageids.length ) || 0;
				for ( i = 0; i < num; i += 1 ) {
					img = data.query.pages[ data.query.pageids[ i ] ];
					if ( img.missing === '' ) {
						images[ img.title ] = 'missing';
					} else {
						for ( j = 0; j < img.imageinfo.length; j += 1 ) {
							r = img.imageinfo[ j ].extmetadata.AttributionRequired
								&& img.imageinfo[ j ].extmetadata.AttributionRequired.value;
							if ( r === 'false' || r === 'no' || r === '0' ) {
								images[ img.title ] = 'valid';
								break;
							} else if ( r === 'true' || r === 'yes' || r === '1' ) {
								images[ img.title ] = 'invalid';
								break;
							};
						}
					}
				}
				if ( pos + batchSize < imgList.length ) {
					doCheck( pos + batchSize );
				} else {
					showInfo( getList( images ) );
				}
			} ).fail( function () {
				showInfo( 'Ops! Não foi possível obter a lista de categorias das imagens do Wikimedia Commons' );
			} );
		};
		commonsApi = new mw.Api( {
			ajax: {
				url: '//commons.wikimedia.org/w/api.php',
				dataType: 'jsonp'
			}
		} );
		doCheck( 0 );
	}

	function getImagesWithoutLinkToDescription() {
		$( '#firstHeading' ).injectSpinner( 'check-cats' );
		var images = {};
		$content.find( 'img' ).filter( function () {
			var $this = $( this ),
				href = $this.parent().attr( 'href' );
			return !( href && href.indexOf( mw.util.getUrl( mw.config.get( 'wgFormattedNamespaces' )[ 6 ] + ':' ) ) === 0 )
				&& !( href && href.indexOf( '//commons.wikimedia.org/wiki/File:' ) === 0 )
				&& !( href && href.indexOf( '//commons.wikimedia.org/w/index.php?title=File:' ) === 0 )
				&& !/\/(?:OggHandler|timeline|(?:magnify-clip|fileicon-ogg)\.png)|data:image/.test( $this.attr( 'src' ) )
				&& !$this.hasClass( 'tool-button' );
		} )
		.each( function () {
			var imgName = $( this ).attr( 'src' )
				.replace( /^.+?\/commons\/(?:thumb\/)?[0-9a-f]\/[0-9a-f]{2}\/(.+?\.(?:png|svg|jpe?g|gif|tiff|xcf|midi|ogg|ogv|webm|flac|wave|djvu|pdf))\/.+$/i, '$1' )
				.replace( /_/g, ' ' );
			imgName = decodeURIComponent( imgName );
			images[ 'File:' + imgName ] = 'unknown';
		} );
		if ( $.isEmptyObject( images ) ) {
			showInfo( 'Não há imagens nesta página sem links para sua página de descrição.' );
		} else {
			checkIfAttributionIsRequired( images );
		}
	}

	// TODO:
	// - Improve auto checking; or
	// - Implement auto fix ;-)

	function run() {
		$content = $( '#mw-content-text' );
		$( mw.util.addPortletLink(
			'p-cactions', '#', 'Verificar imagens sem atribuição', 'ca-check-imgs',
			'Gera uma lista de imagens sem link para a página de descrição'
		) )
		.click( function ( e ) {
			e.preventDefault();
			mw.loader.using( [ 'mediawiki.api', 'jquery.spinner' ], getImagesWithoutLinkToDescription );
		} );
	}

	$( run );

}( mediaWiki, jQuery ) );
