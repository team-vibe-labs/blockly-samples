/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Class responsible for creating a Blockly modal.
 * @author aschmiedt@google.com (Abby Schmiedt)
 */

import * as Blockly from 'blockly/core';

/**
 * Class responsible for creating a Blockly modal.
 */
// TODO: this modal can likely extend on the modal plugin
export class Plugin {
  /**
   * Constructor for creating a Blockly modal.
   * @param {string} title The title for the modal.
   * @param {!Blockly.WorkspaceSvg} workspace The workspace to display the modal
   *     over.
   */
  constructor(title, workspace) {
    /**
     * The title for the modal.
     * @type {string}
     * @private
     */
    this.title_ = title;

    /**
     * The workspace to display the modal over.
     * @type {!Blockly.WorkspaceSvg}
     * @protected
     */
    this.workspace_ = workspace;

    /**
     * The last focusable element for the modal.
     * @type {HTMLElement}
     * @private
     */
    this.lastFocusableEl_ = null;

    /**
     * The first focusable element for the modal.
     * @type {HTMLElement}
     * @private
     */
    this.firstFocusableEl_ = null;

    /**
     * HTML container for the modal.
     * @type {HTMLDivElement}
     * @private
     */
    this.htmlDiv_ = null;

    /**
     * Array holding info needed to unbind events.
     * Used for disposing.
     * Ex: [[node, name, func], [node, name, func]].
     * @type {!Array.<Array<?>>}
     * @private
     */
    this.boundEvents_ = [];

    /**
     * If true close the modal when the user clicks outside the modal.
     * Otherwise, only close when user hits the 'X' button or escape.
     * @type {boolean}
     */
    this.shouldCloseOnOverlayClick = true;

    /**
     * If true close the modal when the user hits escape. Otherwise, do not
     * close on escape.
     */
    this.shouldCloseOnEsc = true;
  }

  /**
   * Initialize a Blockly modal.
   */
  init() {
    console.log('SHORTCUTS: ');
    console.log('Shortcut Registry Shortcuts',
      Blockly.ShortcutRegistry.registry.shortcuts);
    console.log('Shortcut Registry Shortcut items',
      Blockly.ShortcutRegistry.registry.shortcuts.keys());
    // Map shortcut name -> [list of key codes]
    // TODO: maybe consider caching and listening to update cache on registry up
    for (const [key, value] of Blockly.ShortcutRegistry.registry.shortcuts) {
      console.log(`${key} -> ${value.keyCodes}`);
    }

    this.render();
  }

  /**
   * Disposes of this modal.
   * Unlink from all DOM elements and remove all event listeners
   * to prevent memory leaks.
   */
  dispose() {
    for (const event of this.boundEvents_) {
      Blockly.unbindEvent_(event);
    }
    this.boundEvents_ = [];
    if (this.htmlDiv_) {
      this.htmlDiv_.remove();
    }
  }

  /**
   * Shows the Blockly modal and focus on the first focusable element.
   */
  show() {
    Blockly.WidgetDiv.show(this, this.workspace_.RTL, () =>
      this.widgetDispose_()
    );
    this.widgetCreate_();
    const focusableEls = this.htmlDiv_.querySelectorAll(
      'a[href],' +
      'area[href], input:not([disabled]), select:not([disabled]),' +
      'textarea:not([disabled]), button:not([disabled]), [tabindex="0"]'
    );
    if (focusableEls.length > 0) {
      this.firstFocusableEl_ = focusableEls[0];
      this.lastFocusableEl_ = focusableEls[focusableEls.length - 1];
      if (
        focusableEls[0].classList.contains('blocklyModalBtnClose') &&
        focusableEls.length > 1
      ) {
        focusableEls[1].focus();
      } else {
        this.firstFocusableEl_.focus();
      }
    }
  }

  /**
   * Hide the Blockly modal.
   */
  hide() {
    Blockly.WidgetDiv.hide();
  }

  /**
   * The function to be called when the user hits the 'x' button.
   * @protected
   */
  onCancel_() {
    this.hide();
  }

  /**
   * Add the Blockly modal to the widget div and position it properly.
   * @protected
   */
  widgetCreate_() {
    const widgetDiv = Blockly.WidgetDiv.DIV;
    Blockly.utils.dom.addClass(this.htmlDiv_, 'blocklyModalOpen');
    widgetDiv.appendChild(this.htmlDiv_);
  }

  /**
   * Disposes of any events or dom-references belonging to the editor.
   * @protected
   */
  widgetDispose_() {
    Blockly.utils.dom.removeClass(this.htmlDiv_, 'blocklyModalOpen');
  }

  /**
   * Handle when the user goes to the previous focusable element.
   * @param {KeyboardEvent} e The keydown event.
   * @private
   */
  handleBackwardTab_(e) {
    if (document.activeElement === this.firstFocusableEl_) {
      e.preventDefault();
      this.lastFocusableEl_.focus();
    }
  }

  /**
   * Handle when the user goes to the next focusable element.
   * @param {KeyboardEvent} e The keydown event.
   * @private
   */
  handleForwardTab_(e) {
    if (document.activeElement === this.lastFocusableEl_) {
      e.preventDefault();
      this.firstFocusableEl_.focus();
    }
  }

  /**
   * Handles keydown event for a Blockly modal. Handles forward tab, backward
   * tab, and escape button.
   * @param {KeyboardEvent} e The keydown event.
   * @private
   */
  handleKeyDown_(e) {
    if (e.keyCode === Blockly.utils.KeyCodes.TAB) {
      // If there are no elements or there is one element don't wrap.
      if (
        !this.firstFocusableEl_ ||
        this.firstFocusableEl_ === this.lastFocusableEl_
      ) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (e.shiftKey) {
        this.handleBackwardTab_(e);
      } else {
        this.handleForwardTab_(e);
      }
    } else if (
      e.keyCode === Blockly.utils.KeyCodes.ESC &&
      this.shouldCloseOnEsc
    ) {
      this.hide();
    }
    e.stopPropagation();
  }

  /**
   * Helper method for adding an event.
   * @param {!Element} node Node upon which to listen.
   * @param {string} name Event name to listen to (e.g. 'mousedown').
   * @param {Object} thisObject The value of 'this' in the function.
   * @param {!Function} func Function to call when event is triggered.
   * @protected
   */
  addEvent_(node, name, thisObject, func) {
    const event = Blockly.browserEvents.conditionalBind(
      node,
      name,
      thisObject,
      func
    );
    this.boundEvents_.push(event);
  }

  /**
   * Create all the dom elements for the modal.
   */
  render() {
    /*
     * Creates the Modal. The generated modal looks like:
     * <div class="blocklyModalContainer" role="dialog">
     *   <header class="blocklyModalHeader">
     *     <h2 class="blocklyModalHeaderTitle">Modal Name</h2>
     *     <button class="blocklyModalBtn blocklyModalBtnClose">X</button>
     *   </header>
     *   <div class="blocklyModalContent">
     *   </div>
     *   <div class="blocklyModalFooter">
     *   </div>
     * </div>
     */

    // Create Overlay
    this.htmlDiv_ = document.createElement('div');
    this.htmlDiv_.className = 'blocklyModalOverlay';
    // End Creating the Overlay

    // Create Container
    const modalContainer = document.createElement('div');
    modalContainer.className = 'blocklyModalContainer';
    modalContainer.setAttribute('role', 'dialog');
    modalContainer.setAttribute('aria-labelledby', this.title_);
    // End creating the container

    // Add Events
    this.addEvent_(
        /** @type{!HTMLDivElement} */ modalContainer,
      'keydown',
      this,
      this.handleKeyDown_
    );

    if (this.shouldCloseOnOverlayClick) {
      this.addEvent_(this.htmlDiv_, 'click', this, this.hide);
      this.addEvent_(modalContainer, 'click', this, (e) => {
        e.stopPropagation();
      });
    }

    // Create the header
    const modalHeader = document.createElement('header');
    modalHeader.className = 'blocklyModalHeader';

    this.renderHeader_(modalHeader);

    const exitButton = document.createElement('button');
    exitButton.className = 'blocklyModalBtn blocklyModalBtnClose';
    this.addEvent_(exitButton, 'click', this, this.onCancel_);
    modalHeader.appendChild(exitButton);
    // End create header

    // Create content
    const modalContent = document.createElement('div');
    modalContent.className = 'blocklyModalContent';
    this.renderContent_(modalContent);
    // End creating content

    // Create Footer
    const modalFooter = document.createElement('footer');
    modalFooter.className = 'blocklyModalFooter';

    this.renderFooter_(modalFooter);
    // End creating footer

    modalContainer.appendChild(modalHeader);
    modalContainer.appendChild(modalContent);
    modalContainer.appendChild(modalFooter);
    this.htmlDiv_.appendChild(modalContainer);
  }

  /**
   * Render content for the modal header.
   * @param {HTMLElement} headerContainer The modal's header div.
   * @protected
   */
  renderHeader_(headerContainer) {
    const modalTitle = document.createElement('h2');
    modalTitle.className = 'blocklyModalHeaderTitle';
    modalTitle.appendChild(document.createTextNode(this.title_));
    headerContainer.appendChild(modalTitle);
  }

  /**
   * Format keycodes into human friendly format
   * @param keyCodes keycodes to format
   * @protected
   * @return formatted code
   */
  formatCodes(keyCodes) {
    const specialCodes = {
      '27': 'Escape',
      '46': '.',
      '8': 'Backspace',
      'Control': 'Ctrl', // or Cmd for MAC
      'Meta': 'Meta',
      'Shift': 'Shift',
      'Alt': 'Alt',
    };

    return keyCodes.map((codes) => String(codes).split('+').map((code) => {
      if (code in specialCodes) {
        return specialCodes[code];
      }
      // printable ASCII chars
      if (code >= '!' && code <= '~') {
        return String.fromCharCode(Number(code));
      }
      return code;
    }).map((code) => `<code>${code}</code>`).join(' + ')).join(' , ');
  }


  /**
   * Handle search bar filtering
   */
  onEvent_(e) {
    console.log('here');
    console.log('Input value', this.inputElement_.value);
    return;
  }

  /**
   * Creates the text input for the search bar.
   * @return {!HTMLInputElement} A text input for the search bar.
   * @protected
   */
  createTextInput_() {
    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.setAttribute('placeholder', 'Type to search in keybindings');
    return textInput;
  }

  /**
   * Render content for the modal content div.
   * @param {HTMLDivElement} _contentContainer The modal's content div.
   * @param contentContainer
   * @protected
   */
  renderContent_(contentContainer) {
    const modalContent = document.createElement('div');
    // TODO: change this type
    modalContent.className = 'blocklyModalHeaderTitle';

    const inputWrapper = document.createElement('div');
    Blockly.utils.dom.addClass(inputWrapper, 'searchBar');
    this.inputElement_ = this.createTextInput_();
    this.addEvent_(this.inputElement_, 'keydown', this, (evt) => this
      .onEvent_(/** @type {KeyboardEvent} */ evt));

    inputWrapper.appendChild(this.inputElement_)
    modalContent.appendChild(inputWrapper);

    // // TODO: update filter member and rerender shortcut modal every 100ms
    // document.addEventListener('keydown', (e) => {
    //   const target = e.target;
    //   if (target.id == 'search') {
    //     // save off the text value;
    //     console.log('Works!');
    //   }
    // }, true);

    // TODO: we want to insert some HTML node for the table
    let table = '';

    table +=
      `<table>
      <tr>
        <th>Command</th>
        <th>Keybinding</th>
      </tr>`;
    for (const [key, value] of Blockly.ShortcutRegistry.registry.shortcuts) {
      table +=
        `<tr>
         <td>${key}</td>
         <td>${this.formatCodes(value.keyCodes)}</td>
       </tr>`;
    }
    table += `</table>`;

    modalContent.innerHTML += table;

    console.log(table);
    console.log(modalContent.innerHTML);

    contentContainer.appendChild(modalContent);
  }

  /**
   * Render content for the modal footer.
   * @param {HTMLElement} _footerContainer The modal's footer div.
   * @protected
   */
  renderFooter_(_footerContainer) {
    // No-op on the base class.
  }
}

Blockly.Css.register(`
.blocklyModalOverlay {
  width: 100%;
  height: 100%;
  left: 0px;
  top: 0px;
  position: fixed;
}
table {
  border-collapse: collapse;
  border-spacing: 0;
  width: 100%;
  border: 1px solid #ddd;
}

th, td {
  text-align: left;
  padding: 16px;
}
td + td, th + th { border-left:2px solid #ddd; }
tr:nth-child(even) {
  background-color: #f2f2f2;
}
.blocklyModalContainer {
  background-color: white;
  border: 1px solid gray;
  font-family: Helvetica;
  font-weight: 300;
  padding: 1em;
  width: 75vw;
  height: 75vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0px 10px 20px grey;
  z-index: 100;
  margin: auto;
  overflow: scroll;
}
.blocklyModalHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.blocklyModalHeaderTitle {
  margin-top: 0;
  margin-bottom: 0;
  font-size: 1.2em;
  line-height: 1.25;
}
.blocklyModalHeader .blocklyModalBtn {
  margin-left: auto;
  height: fit-content;
}
.blocklyModalBtnClose:before {
  content: "\\2715";
}
.blocklyModalBtn {
  margin-right: .5em;
  border: 1px solid gray;
  font-weight: 500;
  color: gray;
  border-radius: 25px;
}
.blocklyModalBtnPrimary {
  background-color: gray;
  color: white;
}
code {
  background-color: lightGray;
  padding: 4px;
  border-radius: 5px;
}
.searchBar input[type=text] {
  font-size: 17px;
  border-style: solid;
  border-width: 1px;
  border-radius: 5px;
  width: 100%;
  padding: 6px;
  margin-top: 8px;
  margin-right: 16px;
  margin-bottom: 8px;
  box-sizing: border-box;
}
`);
