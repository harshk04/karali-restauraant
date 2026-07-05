import Link from "next/link";
import {
  reservationHref,
  restaurantName,
  restaurantTagline,
} from "./theme-data";

export function AboutThemePage() {
  return (
    <>
      <div className="home">
        <div
          className="parallax_background parallax-window theme-parallax"
          style={{ backgroundImage: "url(/theme1/images/about.jpg)" }}
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
                    <h1>About Karali Restaurant</h1>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="intro">
        <div className="container">
          <div className="row">
            <div className="col">
              <div className="intro_content">
                <div className="intro_subtitle page_subtitle">
                  Indian airport dining
                </div>
                <div className="intro_title">
                  <h2>{restaurantTagline}</h2>
                </div>
                <div className="intro_text">
                  <p>
                    Karali Restaurant is positioned for travelers who want a
                    dependable place to sit down, unwind, and enjoy quality
                    Indian food at Jaipur International Airport.
                  </p>
                </div>
              </div>
              <div className="row">
                <div className="col-lg-8">
                  <div className="intro_image">
                    <img src="/theme1/images/about_intro.jpg" alt="" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="testimonials">
        <div
          className="parallax_background parallax-window theme-parallax"
          style={{ backgroundImage: "url(/theme1/images/testimonials.jpg)" }}
        ></div>
        <div className="container">
          <div className="row">
            <div className="col text-center">
              <div className="section_title_container">
                <div className="section_subtitle page_subtitle">
                  Why Karali works
                </div>
                <div className="section_title">
                  <h1>Made for modern Indian travelers</h1>
                </div>
              </div>
            </div>
          </div>
          <div className="row testimonials_row">
            <div className="col-lg-10 offset-lg-1">
              <div className="test_slider_container">
                <div className="owl-carousel owl-theme test_slider">
                  <div className="owl-item text-center">
                    <div className="quote ml-auto mr-auto">
                      <img src="/theme1/images/quote.png" alt="" />
                    </div>
                    <div className="test_text">
                      <p>
                        From business trips to family departures, Karali
                        Restaurant gives guests a more comfortable airport stop
                        with Indian food, efficient service, and a
                        reservation-first experience.
                      </p>
                    </div>
                    <div className="test_info">
                      Jaipur International Airport,{" "}
                      <span>Terminal 2 Landside</span>
                    </div>
                    <div className="button sig_button trans_200 ml-auto mr-auto">
                      <Link href={reservationHref}>Make Reservation</Link>
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
