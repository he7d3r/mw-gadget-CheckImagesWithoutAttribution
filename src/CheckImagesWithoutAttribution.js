/**
 * Check images without a link to its description
 * @author: [[User:Helder.wiki]]
 * @tracking: [[Special:GlobalUsage/User:Helder.wiki/Tools/CheckImagesWithoutAttribution.js]] ([[File:User:Helder.wiki/Tools/CheckImagesWithoutAttribution.js]])
 */
/*jslint browser: true, white: true, todo: true, regexp: true */
/*global jQuery, mediaWiki */
( function ( mw, $ ) {
'use strict';

function getImagesWithoutLinkToDescription() {
	var list = {},
	$content = $( '#mw-content-text' ),
		$list = $( '<ol>' ),
		$result = $( '<div>' );
	$content.find( 'img' ).filter( function () {
		return !$( this ).parent().is( 'a.image' );
	})
	.each(function () {
		var imgName = $( this ).attr( 'src' )
			.replace( /^.+?\/\d+px-/, '' )
			.replace( /\.svg.png$/g, '.svg' );
		list[imgName] = 1;
	});
	// TODO: Use API to get the wikitext of all images and check it has a license which allow usage without attribution
	$.each( list, function ( imgName ) {
		$list.append(
			$( '<li>' ).append(
				$( '<a>' )
					.attr( 'href', mw.util.wikiGetlink( 'Image:' + imgName ) )
					.text( imgName )
			)
		);
	});

	$content.prepend( $result.append( $list ) );

}

// TODO:
// - Auto check; or
// - Auto fix ;-)
$( function(){
	$( mw.util.addPortletLink(
		'p-cactions', '#', 'Verificar imagens sem atribuição', 'ca-check-imgs',
		'Gera uma lista de imagens sem link para a página de descrição'
	) )
	.click( getImagesWithoutLinkToDescription );
} );

}( mediaWiki, jQuery ) );