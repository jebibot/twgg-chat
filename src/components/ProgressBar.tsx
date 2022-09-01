import styles from "./ProgressBar.module.css";

type ProgressBarProps = {
  error: string;
  progress: string;
};

function ProgressBar({ error, progress }: ProgressBarProps) {
  let className = "";
  let width = "100%";
  let message;
  if (error) {
    className = " bg-danger";
    message = "Error";
  } else if (progress[0] === "-") {
    return null;
  } else if (progress === "100.00") {
    className = " bg-success";
    message = width;
  } else {
    width = `${progress}%`;
    message = width;
  }

  return (
    <div className={`progress m-2 ${styles.progress}`}>
      <div
        className={`progress-bar progress-bar-striped progress-bar-animated${className} f-14`}
        style={{ width }}
        role="progressbar"
        aria-valuenow={Number(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        title={error || message}
      >
        {message}
      </div>
    </div>
  );
}

export default ProgressBar;
