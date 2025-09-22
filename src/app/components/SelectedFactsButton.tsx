import React from "react";

import cardStyles from "../../styles/components/card.module.css";

const SelectedFactsButton = ({
  classNames,
  text,
  icon,
  handleOnClick,
}: {
  classNames: string;
  text: string;
  icon?: string;
  handleOnClick: () => void;
}): React.JSX.Element => {
  return (
    <button
      className={classNames}
      onClick={() => handleOnClick()}
      aria-label={text}
    >
      {icon && <span className={cardStyles.addButtonIcon}>{icon}</span>}
      <span className={cardStyles.addButtonText}>{text}</span>
    </button>
  );
};

export default SelectedFactsButton;
