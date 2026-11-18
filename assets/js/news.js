// News section: folds the list after the most recent few behind a "Show more"
// button that also folds it back. Without this script every item shows.

(function () {
  var section = document.getElementById('news');
  if (!section) return;

  var list = section.querySelector('.news-list');
  if (!list) return;

  var SHOWN = 3;
  var extra = [].slice.call(list.querySelectorAll('.news-item'), SHOWN);
  if (!extra.length) return;

  var toggle = document.createElement('button');
  toggle.className = 'news-toggle';
  toggle.type = 'button';
  list.parentNode.insertBefore(toggle, list.nextSibling);

  var setOpen = function (open) {
    extra.forEach(function (li) { li.hidden = !open; });
    toggle.textContent = open ? 'Show fewer' : 'Show more';
    toggle.setAttribute('aria-expanded', open);
  };
  setOpen(false);

  toggle.addEventListener('click', function () {
    var open = toggle.getAttribute('aria-expanded') !== 'true';
    setOpen(open);
    // Folding the list pulls the button up past the top of the screen.
    if (!open && toggle.getBoundingClientRect().top < 0) {
      toggle.scrollIntoView({ block: 'center' });
    }
  });
})();
