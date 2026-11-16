// Brass Leaf: the sign-up. The form posts to the address in its data-endpoint attribute and the list is kept by us.
// Without this script the form still works: the browser checks it, it posts itself, and the answer is a plain page.
(function () {
  document.documentElement.classList.add('js');
  var form = document.querySelector('[data-signup]');
  if (!form) return;
  form.noValidate = true;   // with script, what is wrong is said in words beside the field
  var email = form.querySelector('input[type="email"]'), age = form.querySelector('[name="over21"]');
  var boxes = form.querySelectorAll('[name="interest"]'), group = form.querySelector('.choices');
  var trap = form.querySelector('[name="leave_empty"]'), status = form.querySelector('.signup__status'), button = form.querySelector('button');
  var started = Date.now(), sending = false;
  // Each thing the form asks for: the field to mark, where its message goes, where the focus lands, and the words.
  var parts = {
    email: { field: email, note: form.querySelector('#signup-email-error'), focus: email, words: 'Please enter an email address, like name@example.com.' },
    interests: { field: group, note: form.querySelector('#signup-interest-error'), focus: boxes[0], words: 'Please check at least one box.' },
    over21: { field: age, note: form.querySelector('#signup-age-error'), focus: age, words: 'Please confirm you are 21 or older.' }
  };
  var LOST = 'That did not go through. Please try again, or call us.';
  var BUSY = 'We are getting a lot of sign-ups just now. Please try again in a little while, or call us.';

  var say = function (text, kind) { status.textContent = text; status.setAttribute('data-kind', kind || ''); };
  var clear = function (name) { var p = parts[name]; p.field.removeAttribute('aria-invalid'); p.note.hidden = true; p.note.textContent = ''; };
  var point = function (name) {
    var p = parts[name];
    p.field.setAttribute('aria-invalid', 'true'); p.note.textContent = p.words; p.note.hidden = false; p.focus.focus();
    if (p.note.scrollIntoView) p.note.scrollIntoView({ block: 'nearest' });   // the words for what is wrong are always on screen
  };
  var chosen = function () { return Array.prototype.filter.call(boxes, function (b) { return b.checked; }).map(function (b) { return b.value; }); };
  var firstProblem = function (value, picks) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) return 'email';
    if (!picks.length) return 'interests';
    return age.checked ? '' : 'over21';
  };
  var busy = function (on) { sending = on; if (on) button.setAttribute('aria-disabled', 'true'); else button.removeAttribute('aria-disabled'); };
  var thank = function () {
    var thanks = document.createElement('p');
    thanks.className = 'signup__thanks lead'; thanks.tabIndex = -1;
    thanks.textContent = "Thank you. We'll write to you as soon as there is news.";
    form.parentNode.replaceChild(thanks, form); thanks.focus();
  };
  var fail = function (text) { busy(false); say(text, 'error'); };
  // The service names what it refused; anything else it says is a failure, and only its own yes is a thank you.
  var read = function (r) {
    if (r.status === 429) { fail(BUSY); return; }
    return r.json().then(function (answer) {
      if (r.ok && answer && answer.ok === true) { thank(); return; }
      var named = r.status === 422 && answer && answer.problems ? Object.keys(parts).filter(function (k) { return answer.problems[k]; })[0] : '';
      if (named) { busy(false); say('', ''); point(named); } else fail(LOST);
    });
  };

  email.addEventListener('input', function () { clear('email'); });
  age.addEventListener('change', function () { clear('over21'); });
  Array.prototype.forEach.call(boxes, function (b) { b.addEventListener('change', function () { clear('interests'); }); });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (sending) return;
    var value = email.value.trim(), picks = chosen();
    Object.keys(parts).forEach(clear);
    var wrong = firstProblem(value, picks);   // one problem at a time: named, marked and given the focus
    if (wrong) { say('', ''); point(wrong); return; }
    var endpoint = form.getAttribute('data-endpoint');
    if (!endpoint) { say('This copy of the page is not collecting addresses. Nothing was sent.', 'hold'); return; }
    busy(true); say('Sending…', '');
    var body = JSON.stringify({ email: value, interests: picks, over21: true, leave_empty: trap.value, elapsed: Date.now() - started, page: location.pathname });
    fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body }).then(read).catch(function () { fail(LOST); });
  });
})();
