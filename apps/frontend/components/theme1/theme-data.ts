export const restaurantName = "Karali Restaurant";
export const restaurantTagline =
  "Jaipur airport dining with a warm Rajasthani welcome";
export const restaurantAddress =
  "Jaipur International Airport, Land Side, T2, Jaipur, Rajasthan 302017";
export const restaurantPhone = "+91 00000 00000";
export const restaurantEmail = "info@karalirestaurant.com";
export const reservationHref = "/book";

export const navItems = [
  { label: "home", href: "/" },
  { label: "about", href: "/about" },
  { label: "contact", href: "/contact" },
] as const;

export const footerContact = [
  { icon: "fa-map-marker", text: restaurantAddress },
  { icon: "fa-phone", text: restaurantPhone },
  { icon: "fa-envelope-o", text: restaurantEmail },
] as const;

export const storyPosts = [
  {
    image: "/theme1/images/blog_1.jpg",
    title: "A calm dining stop before your flight",
    date: "Airport Dining",
    body: "Karali Restaurant offers a comfortable place to slow down, settle in, and enjoy Indian hospitality before departure or after arrival.",
  },
  {
    image: "/theme1/images/blog_2.jpg",
    title: "Rooted in Indian flavours",
    date: "Indian Cuisine",
    body: "From rich curries to familiar favourites, the experience is designed around generous flavour and dependable service in an airport setting.",
  },
  {
    image: "/theme1/images/blog_3.jpg",
    title: "Easy reservations for travelers and families",
    date: "Guest Experience",
    body: "Reserve your table in advance and walk into a smoother dining experience without the stress of searching for a seat at the last minute.",
  },
] as const;

export const guestInfoItems = [
  {
    title: "Comfortable airport dining",
    text: "A welcoming stop for families, business travelers, and guests who want a proper sit-down meal at Jaipur Airport.",
  },
  {
    title: "Simple reservations",
    text: "Use the reservation flow to choose your preferred slot and complete your booking in just a few steps.",
  },
  {
    title: "Convenient location",
    text: "Located on the landside of Terminal 2, making Karali Restaurant easy to access before check-in or after landing.",
  },
] as const;
