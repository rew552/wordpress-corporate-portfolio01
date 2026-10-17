/* No fetch, storage, analytics, or actual submission. Input never enters the DOM as HTML. */
document.querySelectorAll('.demo-form').forEach((form) => {
  const button = form.querySelector('button');
  const status = form.querySelector('[role="status"]');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    form.reset();
    status.textContent = 'デモ操作が完了しました。入力内容は送信・保存されていません。もう一度お試しいただけます。';
    status.hidden = false;
    status.focus();
  });
  button.disabled = false;
});
