// Override browser default validation messages to English
(function() {
  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('input, select, textarea').forEach(function(el) {
      el.addEventListener('invalid', function() {
        if (this.validity.valueMissing) {
          this.setCustomValidity('Please fill out this field.');
        } else if (this.validity.typeMismatch) {
          this.setCustomValidity('Please enter a valid value.');
        } else if (this.validity.patternMismatch) {
          this.setCustomValidity('Please match the requested format.');
        } else if (this.validity.rangeUnderflow) {
          this.setCustomValidity('Please select a higher value.');
        } else if (this.validity.rangeOverflow) {
          this.setCustomValidity('Please select a lower value.');
        } else if (this.validity.stepMismatch) {
          this.setCustomValidity('Please select a valid value.');
        } else {
          this.setCustomValidity('Please fill out this field.');
        }
      });
      el.addEventListener('input', function() {
        this.setCustomValidity('');
      });
    });
  });
})();
