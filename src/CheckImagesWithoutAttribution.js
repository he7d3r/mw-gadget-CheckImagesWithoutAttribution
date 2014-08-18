/**
 * Check images without a link to its description
 * @author: Helder (https://github.com/he7d3r)
 * @license: CC BY-SA 3.0 <https://creativecommons.org/licenses/by-sa/3.0/>
 * @tracking: [[Special:GlobalUsage/User:Helder.wiki/Tools/CheckImagesWithoutAttribution.js]] ([[File:User:Helder.wiki/Tools/CheckImagesWithoutAttribution.js]])
 */
/*jshint browser: true, camelcase: true, curly: true, eqeqeq: true, immed: true, latedef: true, newcap: true, noarg: true, noempty: true, nonew: true, quotmark: true, undef: true, unused: true, strict: true, trailing: true, maxlen: 130, evil: true, onevar: true, laxbreak: true */
/*global jQuery, mediaWiki */
( function ( mw, $ ) {
'use strict';

var commonsApi, $content;

function showInfo( info ) {
	var $result = $( '#img-checker-info' ).empty();
	if( !$( '#img-checker-info' ).length ){
		$result = $( '<div id="img-checker-info">' ).css( {
			'border': '1px solid gray',
			'padding': '0.5em'
		} );
		$content.prepend( $result );
	}
	$result.append( info );
	$.removeSpinner( 'check-cats' );
}

function getList( images ) {
	var colors = {
			valid: '#060',
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
	
function checkCategories( images ) {
	var imgList = Object.keys( images ),
	cats = [
		'Category:Public domain', 'Category:CC-SA-1.0'
	],
	curPos = 0,
	catsInTopLevel = cats.length,
	testImagesAgainstWhiteList = function(){
		var batchSize = 50, // This is the current API limit
		// Get the categories of each image to look for a license which allows usage without attribution
		getCatsForPages = function( pos ){
			commonsApi.get( {
				prop: 'categories',
				cllimit: 500,
				indexpageids: true,
				titles: imgList.slice( pos, pos + batchSize ).join('|')
			} ).done( function( data ){
				var i, j, img, imgCats, num,
					map = function(c){
						return c.title;
					};
				num = (data.query && data.query.pageids && data.query.pageids.length) || 0;
				for( i = 0; i < num; i += 1 ){
					img = data.query.pages[ data.query.pageids[i] ];
					if ( img.missing === '' ){
						images[ img.title ] = 'missing';
					} else {
						imgCats = $.map( img.categories, map );
						for( j = 0; j < imgCats.length; j += 1 ){
							if( $.inArray( imgCats[j], cats ) !== -1 ){
								images[ img.title ] = 'valid';
							}
						}
					}
				}
				if( pos + batchSize < imgList.length ){
					getCatsForPages( pos + batchSize );
				} else {
					showInfo( getList( images ) );
				}
			} ).fail( function(){
				showInfo( 'Ops! Não foi possível obter a lista de categorias das imagens do Wikimedia Commons' );
			} );
		};
		getCatsForPages( 0 );
	},
	getSubCats = function( superCat ){
		mw.log( 'Getting subcats of ' + superCat + ' (' + curPos + ' of ' + catsInTopLevel + ')');
		commonsApi.get( {
			list: 'categorymembers',
			cmtitle: superCat,
			cmprop: 'title',
			cmtype: 'subcat',
			cmlimit: 500
		} ).done( function( data ){
			var i, cat;
			for( i = 0; i < data.query.categorymembers.length; i += 1 ){
				cat = data.query.categorymembers[i].title;
				if ( $.inArray( cat, cats ) === -1 ){
					cats.push( cat );
				}
			}
			// Do only one level deep recursive calls
			if( curPos === 0 ){
				catsInTopLevel = cats.length;
			}
			curPos += 1;
			if( curPos < catsInTopLevel ){
				getSubCats( cats[ curPos ] );
			} else {
				mw.log( 'The list is complete:', cats );
				testImagesAgainstWhiteList();
			}
		} ).fail(function(){
			showInfo( 'Ops! Não foi possível obter a lista de categorias de domínio público do Wikimedia Commons' );
		} );
	};
	commonsApi = new mw.Api( {
		ajax: {
			url: '//commons.wikimedia.org/w/api.php',
			dataType: 'jsonp'
		}
	} );
	getSubCats( cats[ curPos ] );
}

function getImagesWithoutLinkToDescription() {
	$('#firstHeading').injectSpinner('check-cats');
	var images = {};
	$content.find( 'img' ).filter( function () {
		var $this = $( this ),
			href = $( this ).parent().attr('href');
		return !( href && href.indexOf( mw.util.getUrl( mw.config.get( 'wgFormattedNamespaces' )[6] + ':' ) ) === 0 )
			&& ! /\/(?:OggHandler|timeline|magnify-clip\.png)/.test( $this.attr( 'src' ) )
			&& ! $this.hasClass( 'tool-button' );
	})
	.each( function () {
		var imgName = decodeURIComponent( $( this ).attr( 'src' )
			.replace( /^.+?\/commons\/(?:thumb\/)?[0-9a-f]\/[0-9a-f]{2}\//, '' )
			.replace( /^.+?\d+px-/, '' )
			.replace( /\.svg.png$/g, '.svg' )
			.replace( /_/g, ' ' ) );
		images[ 'File:' + imgName ] = 'unknown';
	} );
	if ( $.isEmptyObject( images ) ){
		showInfo( 'Não há imagens nesta página sem links para sua página de descrição.' );
	} else {
		checkCategories( images );
	}
}

// TODO:
// - Improve auto checking; or
// - Implement auto fix ;-)

function run(){
	$content = $( '#mw-content-text' );
	$( mw.util.addPortletLink(
		'p-cactions', '#', 'Verificar imagens sem atribuição', 'ca-check-imgs',
		'Gera uma lista de imagens sem link para a página de descrição'
	) )
	.click( function(e){
		e.preventDefault();
		mw.loader.using( ['mediawiki.api', 'jquery.spinner'], getImagesWithoutLinkToDescription );
	} );
}

$( run );

}( mediaWiki, jQuery ) );