/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module link/ui/linkformview
 */

import View from '@ckeditor/ckeditor5-ui/src/view';
import Template from '@ckeditor/ckeditor5-ui/src/template';
import ViewCollection from '@ckeditor/ckeditor5-ui/src/viewcollection';

import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import LabeledInputView from '@ckeditor/ckeditor5-ui/src/labeledinput/labeledinputview';
import InputTextView from '@ckeditor/ckeditor5-ui/src/inputtext/inputtextview';

import submitHandler from '@ckeditor/ckeditor5-ui/src/bindings/submithandler';
import FocusTracker from '@ckeditor/ckeditor5-utils/src/focustracker';
import FocusCycler from '@ckeditor/ckeditor5-ui/src/focuscycler';
import KeystrokeHandler from '@ckeditor/ckeditor5-utils/src/keystrokehandler';

/**
 * The link form view controller class.
 *
 * See {@link module:link/ui/linkformview~LinkFormView}.
 *
 * @extends module:ui/view~View
 */
export default class LinkFormView extends View {
	/**
	 * @inheritDoc
	 */
	constructor( locale ) {
		super( locale );

		const t = locale.t;

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
		 * The url input view.
		 *
		 * @member {module:ui/labeledinput/labeledinputview~LabeledInputView}
		 */
		this.urlInputView = this._createUrlInput();

		/**
		 * The save button view.
		 *
		 * @member {module:ui/button/buttonview~ButtonView}
		 */
		this.saveButtonView = this._createButton( t( 'Save' ) );
		this.saveButtonView.type = 'submit';
		Template.extend( this.saveButtonView.template, {
			attributes: {
				class: [ 'ck-button-action' ]
			}
		} );

		/**
		 * The cancel button view.
		 *
		 * @member {module:ui/button/buttonview~ButtonView}
		 */
		this.cancelButtonView = this._createButton( t( 'Cancel' ), 'cancel' );

		/**
		 * The unlink button view.
		 *
		 * @member {module:ui/button/buttonview~ButtonView}
		 */
		this.unlinkButtonView = this._createButton( t( 'Unlink' ), 'unlink' );

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

		this.template = new Template( this._getTemplateDefinition() );

		submitHandler( {
			view: this
		} );

		const childViews = [
			this.urlInputView,
			this.saveButtonView,
			this.cancelButtonView,
			this.unlinkButtonView
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

	/**
	 * Create labeled input view.
	 *
	 * @private
	 * @returns {module:ui/labeledinput/labeledinputview~LabeledInputView} Labeled input view instance.
	 */
	_createUrlInput() {
		const t = this.locale.t;

		const labeledInput = new LabeledInputView( this.locale, InputTextView );

		labeledInput.label = t( 'Link URL' );

		return labeledInput;
	}

	/**
	 * Creates button View.
	 *
	 * @private
	 * @param {String} label Button label
	 * @param {String} [eventName] Event name which ButtonView#execute event will be delegated to.
	 * @returns {module:ui/button/buttonview~ButtonView} Button view instance.
	 */
	_createButton( label, eventName ) {
		const button = new ButtonView( this.locale );

		button.label = label;
		button.withText = true;

		if ( eventName ) {
			button.delegate( 'execute' ).to( this, eventName );
		}

		return button;
	}

	/**
	 * Returns template definition.
	 *
	 * @returns {Object}
	 * @protected
	 */
	_getTemplateDefinition() {
		return {
			tag: 'form',

			attributes: {
				class: [
					'ck-link-form',
				]
			},

			children: [
				this.urlInputView,
				{
					tag: 'div',

					attributes: {
						class: [
							'ck-link-form__actions'
						]
					},

					children: [
						this.saveButtonView,
						this.cancelButtonView,
						this.unlinkButtonView
					]
				}
			]
		};
	}
}

/**
 * Fired when the form view is submitted (when one of the child triggered submit event).
 * E.g. click on {@link #saveButtonView}.
 *
 * @event submit
 */

/**
 * Fired when the form view is canceled, e.g. click on {@link #cancelButtonView}.
 *
 * @event cancel
 */

/**
 * Fired when the {@link #unlinkButtonView} is clicked.
 *
 * @event unlink
 */
