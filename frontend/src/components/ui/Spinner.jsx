import styles from './Spinner.module.css';

export default function Spinner() {
  return (
    <div className={styles.spinner}>
      <div className={styles.spinnerBars}>
        <div className={styles.spinnerBar} />
        <div className={styles.spinnerBar} />
        <div className={styles.spinnerBar} />
        <div className={styles.spinnerBar} />
        <div className={styles.spinnerBar} />
      </div>
      <span>Loading...</span>
    </div>
  );
}
