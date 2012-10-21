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
	
function showInfo( images ) {
	var colors = {
			valid: '#3f3',
			missing: '#f33',
			unknown: '#0645AD'
		},
		$list = $( '<ol>' ),
		$result = $( '<div>' ).css( {
			'border': '1px solid gray',
			'padding': '0.5em'
		} );
	
	$.each( images, function ( img ) {
		$list.append(
			$( '<li>' ).append(
				$( '<a>' )
					.attr( 'href', mw.util.wikiGetlink( img ) )
					.css( 'color', colors[ images[ img ] ] )
					.text( img )
			)
		);
	} );

	$content.prepend( $result.append( $list ) );
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
			var i, j, img;
			for( i = 0; i < data.query.pageids.length; i += 1 ){
				img = data.query.pages[ data.query.pageids[i] ];
				if ( img.missing === '' ){
					images[ img.title ] = 'missing';
				} else {
					for( j = 0; j < img.categories.length; j += 1 ){
						if( $.inArray( img.categories[j], cats ) !== -1 ){
							images[ img.title ] = 'valid';
						}
					}
				}
			}
			showInfo( images );
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
	} );
}

function getImagesWithoutLinkToDescription() {
	var images = {};
	$content.find( 'img' ).filter( function () {
		var $this = $( this );
		return !$this.parent().is( 'a.image' )
			&& ! /\/(?:OggHandler|timeline)\//.test( $this.attr( 'src' ) );
	})
	.each( function () {
		var imgName = $( this ).attr( 'src' )
			.replace( /^.+?\/\d+px-/, '' )
			.replace( /\.svg.png$/g, '.svg' );
		images[ 'File:' + imgName ] = 'unknown';
	} );
	checkCategories( images );
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
		mw.loader.using( ['mediawiki.api'], getImagesWithoutLinkToDescription );
	} );
}

$( run );

}( mediaWiki, jQuery ) );