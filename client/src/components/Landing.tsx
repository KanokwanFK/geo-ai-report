import styles from "./styles/Landing.module.css";
import Map  from "../components/imge/map..jpg";

const Landing = () => {
    return(
        <div className={styles.Container}>
            <div className={styles.mapContainer}>
                <img className={styles.mapImage} src={Map} alt="Map" />
            </div>
            <div className={styles.contentContainer}>
                <button className={styles.startButton} onClick={() => window.location.href = '/Login'}>
                    เริ่มต้นใช้งาน
                </button>
                
            </div>
            <div className={styles.contentContainer}>
                <p className={styles.description}>
                    เว็บไซต์นี้ทำหน้าที่เป็นสื่อกลางในการรับแจ้งปัญหาสาธารณะ<br />
                    โดยเจ้าหน้าที่จากหน่วยงานที่เกี่ยวข้องจะดำเนินการตรวจสอบและแก้ไขตามลำดับความเหมาะสม
                </p>
            </div>
        </div>
    );
}

export default Landing;