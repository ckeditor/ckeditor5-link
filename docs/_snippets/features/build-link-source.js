/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/* globals window */

import ClassicEditor from '@ckeditor/ckeditor5-build-classic/src/ckeditor';
import { CS_CONFIG } from '@ckeditor/ckeditor5-cloud-services/tests/_utils/cloud-services-config';

import BalloonPanelView from '@ckeditor/ckeditor5-ui/src/panel/balloon/balloonpanelview';
import Rect from '@ckeditor/ckeditor5-utils/src/dom/rect';
import View from '@ckeditor/ckeditor5-ui/src/view';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import cancelIcon from '@ckeditor/ckeditor5-core/theme/icons/cancel.svg';

window.ClassicEditor = ClassicEditor;
window.CS_CONFIG = CS_CONFIG;

window.pinTourBalloon = function( editor, { target, message, positions = [] } ) {
	const balloon = new BalloonPanelView();
	const messageView = new View();
	const closeButtonView = new ButtonView();
	const sonarView = new View();

	balloon.listenTo( target, 'mousedown', () => {
		balloon.unpin();
	} );

	balloon.class = 'live-snippet__tour-balloon';

	closeButtonView.set( {
		withText: false,
		icon: cancelIcon,
		label: 'Close',
		class: 'live-snippet__tour-balloon__button'
	} );

	closeButtonView.on( 'execute', () => {
		balloon.unpin();
	} );

	messageView.setTemplate( {
		tag: 'div',
		attributes: {
			class: [
				'live-snippet__tour-balloon__message'
			]
		},
		children: [
			{
				text: message
			}
		]
	} );

	sonarView.setTemplate( {
		tag: 'div',
		attributes: {
			class: [
				'live-snippet__tour-balloon__sonar'
			]
		}
	} );

	balloon.content.add( messageView );
	balloon.content.add( closeButtonView );
	balloon.content.add( sonarView );

	editor.ui.view.body.add( balloon );

	balloon.show();
	balloon.pin( {
		target: () => {
			const rect = new Rect( target );

			// Hide the balloon when the target lands in the grouped items dropdown at the end
			// of the toolbar (becomes invisible). Unfortunately, it works one–way only, it hides
			// but does not show the hint balloon because it pinning logic automatically stops when
			// #isVisible is false.
			balloon.isVisible = rect.getArea() > 0;

			return rect;
		},
		fitInViewport: true,
		positions: positions.map( position => BalloonPanelView.defaultPositions[ position ] ),
	} );
};

