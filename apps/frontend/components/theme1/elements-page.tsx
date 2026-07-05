import Link from "next/link";
import {
  guestInfoItems,
  reservationHref,
  restaurantName,
} from "./theme-data";

export function ElementsThemePage() {
  return (
    <>
      <div className="home">
        <div
          className="parallax_background parallax-window theme-parallax"
          style={{ backgroundImage: "url(/theme1/images/elements.jpg)" }}
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
                    <h1>Guest Information</h1>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="elements">
        <div className="container">
          <div className="row">
            <div className="col">
              <div className="icon_boxes">
                <div className="elements_title">What to expect</div>
                <div className="row icon_boxes_row">
                  {guestInfoItems.map((item) => (
                    <div key={item.title} className="col-lg-4 icon_box_col">
                      <div className="icon_box">
                        <div className="icon_box_title_container d-flex flex-row align-items-center justify-content-start">
                          <div className="icon_box_title">{item.title}</div>
                        </div>
                        <div className="icon_box_text">
                          <p>{item.text}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="buttons">
                <div className="elements_title">Reservations</div>
                <div className="buttons_container d-flex flex-row align-items-start justify-content-start flex-wrap">
                  <div className="button button_1">
                    <Link href={reservationHref}>Make Reservation</Link>
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
