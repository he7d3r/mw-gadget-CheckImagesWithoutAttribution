/**
 * Check images without a link to its description
 * @author: [[User:Helder.wiki]]
 * @tracking: [[Special:GlobalUsage/User:Helder.wiki/Tools/CheckImagesWithoutAttribution.js]] ([[File:User:Helder.wiki/Tools/CheckImagesWithoutAttribution.js]])
 */
/*jslint browser: true, white: true, todo: true, regexp: true */
/*global jQuery, mediaWiki */
( function ( mw, $ ) {
'use strict';

var commonsApi, $content;

function showInfo( info ) {
	var $result = $( '<div>' ).css( {
			'border': '1px solid gray',
			'padding': '0.5em'
		} );
	$content.prepend( $result.append( info ) );
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
					.attr( 'href', mw.util.wikiGetlink( 'commons:' + img ) )
					.css( 'color', colors[ images[ img ] ] )
					.text( img )
			)
		);
	} );
	return $list;
}
	
function checkCategories( images ) {
	var whiteListedCats = [
		'Category:CC-SA-1.0', 'Category:Public domain'
	],
	testImagesAgainstWhiteList = function( cats ){
		// Get the categories of each image to look for a license which allows usage without attribution
		commonsApi.get( {
			prop: 'categories',
			cllimit: 500,
			indexpageids: true,
			titles: Object.keys( images ).join( '|' )
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
			showInfo( getList( images ) );
		} ).fail(function(){
			showInfo( 'Ops! Não foi possível obter a lista de categorias das imagens do Wikimedia Commons' );
		} );
	};
	
	commonsApi = new mw.Api( {
		ajax: {
			url: '//commons.wikimedia.org/w/api.php',
			dataType: 'jsonp'
		}
	} );
	
	commonsApi.get( {
		list: 'categorymembers',
		cmtitle: 'Category:Public domain',
		cmprop: 'title',
		cmnamespace: 14,
		cmlimit: 500
	} ).done( function( data ){
		var i, cats = [];
		for( i = 0; i < data.query.categorymembers.length; i += 1 ){
			cats.push( data.query.categorymembers[i].title );
		}
		for( i = 0; i < whiteListedCats.length; i += 1 ){
			if ( $.inArray( whiteListedCats[i], cats ) !== -1 ){
				cats.push( whiteListedCats[i] );
			}
		}
		testImagesAgainstWhiteList( cats );
	} ).fail(function(){
		showInfo( 'Ops! Não foi possível obter a lista de categorias de domínio público do Wikimedia Commons' );
	} );
}

function getImagesWithoutLinkToDescription() {
	$('#firstHeading').injectSpinner('check-cats');
	var images = {};
	$content.find( 'img' ).filter( function () {
		var $this = $( this );
		return !$this.parent().is( 'a.image' )
			&& ! /\/(?:OggHandler|timeline|magnify-clip\.png)/.test( $this.attr( 'src' ) );
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