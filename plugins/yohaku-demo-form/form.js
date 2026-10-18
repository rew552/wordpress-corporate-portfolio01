/*
 * Contact form interaction for the disposable Playground demo.
 * No fetch, storage, analytics or actual submission is performed.
 */
(() => {
  'use strict';

  const SELECTORS = {
    form: '.demo-form',
    submit: 'button[type="submit"]',
    status: '[role="status"]',
  };

  const SUCCESS_MESSAGE =
    'デモ操作が完了しました。入力内容は送信・保存されていません。もう一度お試しいただけます。';

  function completeDemoSubmission(form, status) {
    form.reset();
    status.textContent = SUCCESS_MESSAGE;
    status.hidden = false;
    status.focus();
  }

  function initializeDemoForm(form) {
    const button = form.querySelector(SELECTORS.submit);
    const status = form.querySelector(SELECTORS.status);

    if (!button || !status) {
      return;
    }

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      if (!form.reportValidity()) {
        return;
      }

      completeDemoSubmission(form, status);
    });

    button.disabled = false;
  }

  document.querySelectorAll(SELECTORS.form).forEach(initializeDemoForm);
})();
