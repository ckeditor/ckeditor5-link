/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module link/ui/linkactionsview
 */

import View from '@ckeditor/ckeditor5-ui/src/view';
import Template from '@ckeditor/ckeditor5-ui/src/template';
import ViewCollection from '@ckeditor/ckeditor5-ui/src/viewcollection';

import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import FocusTracker from '@ckeditor/ckeditor5-utils/src/focustracker';
import FocusCycler from '@ckeditor/ckeditor5-ui/src/focuscycler';
import KeystrokeHandler from '@ckeditor/ckeditor5-utils/src/keystrokehandler';

/**
 * The link form view controller class.
 *
 * See {@link module:link/ui/linkactionsview~LinkActionsView}.
 *
 * @extends module:ui/view~View
 */
export default class LinkActionsView extends View {
	/**
	 * @inheritDoc
	 */
	constructor( locale ) {
		super( locale );

		/**
		 * Tracks information about DOM focus in the form.
		 *
		 * @readonly
		 * @member {module:utils/focustracker~FocusTracker}
		 */
		this.focusTracker = new FocusTracker();

		/**
		 * Instance of the {@link module:utils/keystrokehandler~KeystrokeHandler}.
		 *
		 * @readonly
		 * @member {module:utils/keystrokehandler~KeystrokeHandler}
		 */
		this.keystrokes = new KeystrokeHandler();

		/**
		 * TODO
		 *
		 * @member {TODO}
		 */
		this.linkOpenerView = this._createLinkOpenerView();

		/**
		 * TODO
		 *
		 * @member {module:ui/button/buttonview~ButtonView}
		 */
		this.editButtonView = this._createEditButtonView();

		/**
		 * TODO
		 *
		 * @member {module:ui/button/buttonview~ButtonView}
		 */
		this.unlinkButtonView = this._createUnlinkButtonView();

		/**
		 * A collection of views which can be focused in the form.
		 *
		 * @readonly
		 * @protected
		 * @member {module:ui/viewcollection~ViewCollection}
		 */
		this._focusables = new ViewCollection();

		/**
		 * Helps cycling over {@link #_focusables} in the form.
		 *
		 * @readonly
		 * @protected
		 * @member {module:ui/focuscycler~FocusCycler}
		 */
		this._focusCycler = new FocusCycler( {
			focusables: this._focusables,
			focusTracker: this.focusTracker,
			keystrokeHandler: this.keystrokes,
			actions: {
				// Navigate form fields backwards using the shift + tab keystroke.
				focusPrevious: 'shift + tab',

				// Navigate form fields forwards using the tab key.
				focusNext: 'tab'
			}
		} );

		this.template = new Template( {
			tag: 'form',

			attributes: {
				class: [
					'ck-link-actions',
				],

				// https://github.com/ckeditor/ckeditor5-link/issues/90
				tabindex: '-1'
			},

			children: [
				this.linkOpenerView,
				this.editButtonView,
				this.unlinkButtonView,
			]
		} );

		const childViews = [
			this.linkOpenerView,
			this.editButtonView,
			this.unlinkButtonView,
		];

		childViews.forEach( v => {
			// Register the view as focusable.
			this._focusables.add( v );

			// Register the view in the focus tracker.
			this.focusTracker.add( v.element );
		} );
	}

	/**
	 * @inheritDoc
	 */
	init() {
		// Start listening for the keystrokes coming from #element.
		this.keystrokes.listenTo( this.element );

		return super.init();
	}

	/**
	 * Focuses the fist {@link #_focusables} in the form.
	 */
	focus() {
		this._focusCycler.focusFirst();
	}

	_createLinkOpenerView() {
		const opener = new View( this.locale );
		const bind = opener.bindTemplate;

		opener.set( 'href' );

		opener.template = new Template( {
			tag: 'a',
			attributes: {
				class: [
					'ck-link-actions__opener'
				],
				target: '_blank',
				href: bind.to( 'href' ),
				tabindex: -1
			},
			children: [
				{
					text: bind.to( 'href' )
				}
			]
		} );

		opener.focus = function() {
			this.element.focus();
		};

		return opener;
	}

	_createEditButtonView() {
		const t = this.locale.t;
		const button = new ButtonView( this.locale );

		button.label = t( 'Edit' );
		button.withText = true;

		button.delegate( 'execute' ).to( this, 'edit' );

		return button;
	}

	_createUnlinkButtonView() {
		const t = this.locale.t;
		const button = new ButtonView( this.locale );

		button.label = t( 'Unlink' );
		button.withText = true;

		button.delegate( 'execute' ).to( this, 'unlink' );

		return button;
	}
}
