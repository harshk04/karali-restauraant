import Link from "next/link";
import {
  guestInfoItems,
  reservationHref,
  restaurantName,
} from "./theme-data";

export function MenuThemePage() {
  return (
    <>
      <div className="home">
        <div
          className="parallax_background parallax-window theme-parallax"
          style={{ backgroundImage: "url(/theme1/images/menu.jpg)" }}
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
                    <h1>Karali Experience</h1>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="themenu">
        <div className="container">
          <div className="row">
            <div className="col">
              <div className="section_title_container text-center">
                <div className="section_subtitle page_subtitle">
                  Guest experience
                </div>
                <div className="section_title">
                  <h1>
                    Designed for airport guests who value comfort and
                    convenience
                  </h1>
                </div>
              </div>
            </div>
          </div>
          <div className="row themenu_text_row">
            <div className="col-lg-6">
              <div className="themenu_text">
                <p>
                  Karali Restaurant is created for travelers who want a proper
                  sit-down meal instead of a rushed stop.
                </p>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="themenu_text">
                <p>
                  Whether you are dining with family or stopping between travel
                  plans, Karali offers Indian hospitality in a polished airport
                  setting.
                </p>
              </div>
            </div>
          </div>
          <div className="row themenu_row">
            {guestInfoItems.map((item, index) => (
              <div key={item.title} className="col-lg-4 themenu_column">
                <div className="themenu_image">
                  <img
                    src={`/theme1/images/${
                      index === 0
                        ? "starters"
                        : index === 1
                          ? "main"
                          : "deserts"
                    }.jpg`}
                    alt={item.title}
                  />
                </div>
                <div className="themenu_col trans_400">
                  <div className="themenu_col_title">{item.title}</div>
                  <div className="themenu_text">
                    <p>{item.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="sig">
        <div className="container">
          <div className="row">
            <div className="col">
              <div className="section_title_container">
                <div className="section_subtitle page_subtitle">
                  Reserve ahead
                </div>
                <div className="section_title">
                  <h1>Skip the uncertainty and book your table</h1>
                </div>
              </div>
            </div>
          </div>
          <div className="row sig_row">
            <div className="col-lg-8">
              <div className="themenu_text">
                <p>
                  Use the reservation page to select your preferred date, time,
                  and number of guests. It is the simplest way to plan your
                  visit to Karali Restaurant.
                </p>
              </div>
              <div className="button sig_button trans_200">
                <Link href={reservationHref}>Make Reservation</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
