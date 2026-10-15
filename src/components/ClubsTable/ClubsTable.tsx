import styles from "./ClubsTable.module.scss";

export type ClubRow = {
  id: string;
  name: string;
  coachCount: number;
  lifterCount: number;
};

type ClubsTableProps = {
  clubs: ClubRow[];
  /** The club the admin is acting in, if there is a valid one. */
  activeClubId: string | null;
};

export function ClubsTable({ clubs, activeClubId }: ClubsTableProps) {
  if (clubs.length === 0) {
    return <p className={styles.empty}>No clubs yet.</p>;
  }

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <caption className={styles.caption}>All clubs</caption>
        <thead>
          <tr>
            <th scope="col">Club</th>
            <th scope="col" className={styles.number}>
              Coaches
            </th>
            <th scope="col" className={styles.number}>
              Lifters
            </th>
          </tr>
        </thead>
        <tbody>
          {clubs.map((club) => {
            const isActive = club.id === activeClubId;
            return (
              <tr
                key={club.id}
                className={isActive ? styles.active : undefined}
              >
                <th scope="row" className={styles.name}>
                  {club.name}
                  {isActive && <span className={styles.chip}>Active</span>}
                </th>
                <td className={styles.number}>{club.coachCount}</td>
                <td className={styles.number}>{club.lifterCount}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
