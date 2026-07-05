import Link from "next/link";
import { VideoLightbox } from "./theme-interactive";
import {
  guestInfoItems,
  reservationHref,
  restaurantAddress,
  restaurantName,
} from "./theme-data";

export function HomeThemePage() {
  return (
    <>
      <div className="home">
        <div
          className="parallax_background parallax-window theme-parallax"
          style={{ backgroundImage: "url(/theme1/images/home.jpg)" }}
        ></div>
        <div className="home_container">
          <div className="container">
            <div className="row">
              <div className="col">
                <div className="home_content text-center">
                  <div className="home_subtitle page_subtitle">
                    Welcome to {restaurantName}
                  </div>
                  <div className="home_title">
                    <h1>Indian dining at Jaipur International Airport</h1>
                  </div>
                  <div className="home_text ml-auto mr-auto">
                    <p>
                      Enjoy a relaxed airport dining experience with warm
                      service, Indian flavours, and a comfortable setting at
                      Terminal 2 landside.
                    </p>
                  </div>
                  <div className="button home_reservation_button trans_200 ml-auto mr-auto">
                    <Link href={reservationHref}>Make Reservation</Link>
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
                  Airport hospitality
                </div>
                <div className="intro_title">
                  <h2>
                    A convenient place to dine before or after your journey
                  </h2>
                </div>
                <div className="intro_text">
                  <p>
                    Karali Restaurant welcomes travelers, families, and
                    business guests with a polished atmosphere and thoughtful
                    Indian dining close to the airport terminal.
                  </p>
                </div>
              </div>
              <div className="row">
                <div className="col-xl-4 col-md-6 intro_col">
                  <div className="intro_image">
                    <img src="/theme1/images/intro_1.jpg" alt="" />
                  </div>
                </div>
                <div className="col-xl-4 col-md-6 intro_col">
                  <div className="intro_image">
                    <img src="/theme1/images/intro_2.jpg" alt="" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="video_section">
        <div
          className="background_image"
          style={{ backgroundImage: "url(/theme1/images/video.jpg)" }}
        ></div>
        <div className="video_section_content d-flex flex-column align-items-center justify-content-center text-center">
          <div className="video_section_title">
            A calm pause in the middle of travel
          </div>
          <div className="video_section_icon">
            <VideoLightbox href="https://player.vimeo.com/video/99340873?autoplay=1&loop=1&title=0&autopause=0" />
          </div>
        </div>
      </div>

      <div className="sig">
        <div className="sig_content_container">
          <div className="container">
            <div className="row">
              <div className="col-lg-7">
                <div className="sig_content">
                  <div className="sig_subtitle page_subtitle">
                    Why guests choose Karali
                  </div>
                  <div className="sig_title">
                    <h1>Built for comfort, convenience, and Indian taste</h1>
                  </div>
                  <div className="rating_r sig_rating rating_r_5">
                    <i></i>
                    <i></i>
                    <i></i>
                    <i></i>
                    <i></i>
                  </div>
                  <div className="sig_name_container d-flex flex-row align-items-start justify-content-start">
                    <div className="sig_name">
                      Landside airport location at Terminal 2
                    </div>
                    <div className="sig_price ml-auto">Jaipur</div>
                  </div>
                  <div className="sig_content_list">
                    <ul className="d-flex flex-row align-items-center justify-content-start">
                      {[
                        "Indian cuisine",
                        "Easy access",
                        "Family friendly",
                        "Reserve online",
                      ].map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="button sig_button trans_200 landing_location_button">
                    <Link href="/contact">View Location</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="sig_image_container">
          <div className="container">
            <div className="row">
              <div className="col-lg-7 offset-lg-5">
                <div className="sig_image">
                  <div
                    className="background_image"
                    style={{ backgroundImage: "url(/theme1/images/sig.jpg)" }}
                  ></div>
                  <img src="/theme1/images/sig.jpg" alt="" />
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
              <div className="themenu_title_bar_container">
                <div className="themenu_stars text-center page_subtitle">
                  Karali Highlights
                </div>
                <div className="themenu_title_bar d-flex flex-column align-items-center justify-content-center">
                  <div className="themenu_title">
                    Everything you need for a smooth airport dining stop
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="row themenu_row">
            {guestInfoItems.map((item) => (
              <div key={item.title} className="col-lg-4 themenu_column">
                <div className="themenu_col">
                  <div className="themenu_col_title">{item.title}</div>
                  <div className="themenu_text">
                    <p>{item.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="row">
            <div className="col">
              <div className="themenu_text text-center">
                <p>{restaurantAddress}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
