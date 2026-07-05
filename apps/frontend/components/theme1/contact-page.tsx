import Link from "next/link";
import {
  reservationHref,
  restaurantAddress,
  restaurantEmail,
  restaurantName,
  restaurantPhone,
} from "./theme-data";

export function ContactThemePage() {
  return (
    <>
      <div className="home">
        <div
          className="parallax_background parallax-window theme-parallax"
          style={{ backgroundImage: "url(/theme1/images/contact.jpg)" }}
        ></div>
        <div className="home_container">
          <div className="container">
            <div className="row">
              <div className="col">
                <div className="home_content text-center">
                  <div className="home_subtitle page_subtitle">
                    {restaurantName}
                  </div>
                  <div className="home_title">
                    <h1>Contact</h1>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="contact">
        <div className="container">
          <div className="row">
            <div className="col-lg-6">
              <div className="contact_title">Contact info</div>
              <div className="contact_text">
                <p>
                  Visit Karali Restaurant at Jaipur International Airport for a
                  smooth dine-in experience before or after your journey.
                </p>
              </div>
              <div className="contact_logo_container">
                <div className="contact_logo_title">Karali</div>
                <div className="contact_logo_subtitle">restaurant</div>
              </div>
              <div className="button sig_button trans_200 contact_reservation_button">
                <Link href={reservationHref}>Make Reservation</Link>
              </div>
            </div>
            <div className="col-xl-5 col-lg-6">
              <div className="contact_list_container d-flex flex-column align-items-lg-center justify-content-start">
                <div className="contact_list_content">
                  <ul className="contact_list">
                    <li className="d-flex flex-row align-items-start justify-content-start">
                      <div className="contact_list_icon">
                        <i className="fa fa-map-marker" aria-hidden="true"></i>
                      </div>
                      <div>{restaurantAddress}</div>
                    </li>
                    <li className="d-flex flex-row align-items-start justify-content-start">
                      <div className="contact_list_icon">
                        <i className="fa fa-phone" aria-hidden="true"></i>
                      </div>
                      <div>{restaurantPhone}</div>
                    </li>
                    <li className="d-flex flex-row align-items-start justify-content-start">
                      <div className="contact_list_icon">
                        <i className="fa fa-envelope-o" aria-hidden="true"></i>
                      </div>
                      <div>{restaurantEmail}</div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="row google_map_row">
            <div className="col">
              <div className="contact_map">
                <div className="map">
                  <div id="google_map" className="google_map">
                    <div className="map_container">
                      <iframe
                        id="map"
                        title="Karali Restaurant map"
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3560.336589253297!2d75.80582199999999!3d26.8292447!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x396db57b9c887adb%3A0xc376c5dd4009c138!2sKarali%20Jaipur!5e0!3m2!1sen!2sin!4v1783171026906!5m2!1sen!2sin"
                        loading="lazy"
                        referrerPolicy="strict-origin-when-cross-origin"
                      ></iframe>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
