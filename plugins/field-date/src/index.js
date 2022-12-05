/**
 * @license
 * Copyright 2015 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Date input field.
 * @author pkendall64@gmail.com (Paul Kendall)
 */

import * as Blockly from 'blockly/core';

/**
 * Ensures that the input value is a valid date.
 * @param {*=} newValue The input value.
 * @return {?string} A valid date, or null if invalid.
 */
function dateValidator(newValue) {
  if (!newValue) {
    return null;
  }
  if (!/^([0-9][0-9][0-9][0-9])-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$/
      .test(newValue)) {
    return null;
  }

  return newValue;
}

// /**
//  * Get current date
//  */
// function initialDateValue() {
//   let initialDate = new Date();
//   const offset = initialDate.getTimezoneOffset();

//   initialDate = new Date(initialDate.getTime() - (offset * 60 * 1000));
//   return initialDate.toISOString().split('T')[0];
// }

/**
 * Class for a date input field.
 * @extends {Blockly.FieldTextInput}
 */
export class FieldDate extends Blockly.FieldTextInput {
  /**
   * Class for a date input field. Derived from the Closure library date
   * picker.
   * @param {string=} value The initial value of the field. Should be in
   *    'YYYY-MM-DD' format. Defaults to the current date.
   * @param {Function=} validator A function that is called to validate
   *    changes to the field's value. Takes in a date string & returns a
   *    validated date string ('YYYY-MM-DD' format), or null to abort the
   *    change.
   */

  /**
   * Class for a date input field. Built using <input type='date'/> date picker
   * @param {string=} value The initial value of the field. Should be in
   *    'yyyy-mm-dd' format. Defaults to today's date.
   * @param {Function=} validator A function that is called to validate
   *    changes to the field's value. Takes in a time string and returns a
   *    validated date string ('yyyy-mm-dd' format), or null to abort the
   *    change.
   */
  constructor(value = '2000-10-10', validator = undefined) {
    // const initial = dateValidator(value) || initialDateValue()
    super(value, validator);

    this.CURSOR = 'pointer';
    this.dateInput = null;
  }

  /**
   * Constructs a FieldDate from a JSON arg object.
   * @param {!Object} options A JSON object with options (date).
   * @return {!FieldDate} The new field instance.
   * @package
   * @nocollapse
   */
  static fromJson(options) {
    return new FieldDate(options['date'], undefined);
  }

  /**
   * Ensures that the input value is a valid date.
   * @param {*=} newValue The input value.
   * @return {?string} A valid date, or null if invalid.
   * @protected
   */
  doClassValidation_(newValue = undefined) {
    return dateValidator(newValue);
  }

  /**
   * Create the date input editor widget.
   * Override the default text input to be a date input
   *
   * @return {!HTMLElement }The newly created date input editor.
   * @protected
   * @override
   */
  widgetCreate_() {
    const div = Blockly.WidgetDiv.getDiv();
    this.picker = super.widgetCreate_();
    this.picker.style.cursor = 'pointer';
    this.picker.setAttribute('type', 'date');
    this.picker.style.opacity = '0';
    this.picker.className = 'datePicker';

    this.picker.addEventListener('click', (e) => {
      this.picker.showPicker(e);
    });

    div.appendChild(this.picker);
    return this.picker;
  }

  /**
   * Show the date picker
   * @param {Event=} e Optional mouse event that triggered the field to
   *     open, or undefined if triggered programmatically.
   * @protected
   * @override
   */
  showEditor_(e = undefined) {
    super.showEditor_(e);

    if (this.picker) {
      this.picker.showPicker();
    }
  }
}

Blockly.fieldRegistry.register('field_date', FieldDate);

Blockly.Css.register(`
.datePicker {
  opacity: 0;
}
input::-webkit-calendar-picker-indicator {
  cursor: pointer;
}
`);
