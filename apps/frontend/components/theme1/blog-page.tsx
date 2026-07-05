import { restaurantName, storyPosts } from "./theme-data";

export function BlogThemePage() {
  return (
    <>
      <div className="home">
        <div
          className="parallax_background parallax-window theme-parallax"
          style={{ backgroundImage: "url(/theme1/images/blog.jpg)" }}
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
                    <h1>Karali Stories</h1>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="blog">
        <div className="container">
          <div className="row">
            {storyPosts.map((post) => (
              <div key={post.image} className="col-lg-6 blog_col">
                <div className="blog_post">
                  <div className="blog_post_image_container">
                    <div className="blog_post_image">
                      <img src={post.image} alt={post.title} />
                    </div>
                    <div className="blog_post_date">
                      <a href="#">{post.date}</a>
                    </div>
                  </div>
                  <div className="blog_post_content">
                    <div className="blog_post_title">
                      <a href="#">{post.title}</a>
                    </div>
                    <div className="blog_post_info">
                      <ul className="d-flex flex-row align-items-center justify-content-start">
                        <li>
                          by <a href="#">Karali Restaurant</a>
                        </li>
                      </ul>
                    </div>
                    <div className="blog_post_text">
                      <p>{post.body}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
