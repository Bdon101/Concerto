const darkModeEventType = "darkmode:toggle";
const darkModeClassName = "dark-mode";

const relayDarkModeToggle = (event) => {
  if (!(event.target instanceof HTMLInputElement) || event.target.type !== "checkbox") {
    throw new TypeError("Dark mode relay expected a checkbox change event.");
  }

  if (!(event.currentTarget instanceof HTMLLabelElement)) {
    throw new TypeError("Dark mode relay expected a label currentTarget.");
  }

  event.stopPropagation();

  const toggleEvent = new CustomEvent(darkModeEventType, {
    bubbles: true,
    detail: {
      checked: event.target.checked,
    },
  });

  event.currentTarget.dispatchEvent(toggleEvent);
};

const toggleDarkModeClass = (event) => {
  if (!(event.currentTarget instanceof HTMLBodyElement)) {
    throw new TypeError("Dark mode handler expected the body element.");
  }

  const checked = event.detail?.checked;

  if (typeof checked !== "boolean") {
    throw new TypeError("Dark mode event detail must include a checked boolean.");
  }

  event.currentTarget.classList.toggle(darkModeClassName, checked);
};

const initDarkModeToggle = () => {
  if (!(document.body instanceof HTMLBodyElement)) {
    throw new TypeError("Dark mode setup could not find the page body.");
  }

  document.body.addEventListener(darkModeEventType, toggleDarkModeClass);

  const toggleLabels = document.querySelectorAll("[data-darkmode-toggle]");

  toggleLabels.forEach((toggleLabel) => {
    if (!(toggleLabel instanceof HTMLLabelElement)) {
      throw new TypeError("Dark mode toggle selector must target label elements.");
    }

    const toggleInput = toggleLabel.querySelector('input[type="checkbox"]');

    if (!(toggleInput instanceof HTMLInputElement)) {
      throw new TypeError("Dark mode toggle label must contain a checkbox input.");
    }

    toggleInput.checked = document.body.classList.contains(darkModeClassName);
    toggleLabel.onchange = relayDarkModeToggle;
  });
};

initDarkModeToggle();
