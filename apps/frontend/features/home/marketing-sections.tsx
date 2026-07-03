import { Button, Card } from "@karali/ui";

export function MarketingSections() {
  return (
    <div className="space-y-14">
      <section className="relative overflow-hidden rounded-[32px] border border-white/20 bg-white/70 shadow-[0_10px_30px_-5px_rgba(30,41,59,0.08)]">
        <div className="absolute inset-0">
          <img
            alt="Karali hero"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDZMtmca_QDMIXIgTw3u-_VvcVGcZrzx6qMtRDckHVwgjL4zGO9qLko01rhCfsGDq5mc2OYP7l0XrjBYn15-oIs45jUSlYmO9cuo-5oe61azl3fY6IT2iOGBaMooaIKrRc8t7QrFgVo8HQiuRn7VWyrLG2w1hj498-NMyaDnFywL2EvTg5P7cONa9ketiZIWsOuzAkU5XT3u_Mxf6dJCrf_-dDJhoiBS6uzbv4bDU5lwlbO0cWjr_5FcijbCRq8n9yStXHbq3QSv39C"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#fff8f5] via-[#fff8f5]/70 to-transparent" />
        </div>

        <div className="relative z-10 px-6 py-20 md:px-10 md:py-24 lg:px-12">
          <div className="max-w-xl space-y-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#8f4a00]">Effortless Dining</p>
            <h1 className="text-5xl font-bold leading-[1.03] text-[#231a13] md:text-6xl">
              Reserve Your Seat
              <br />
              Before You Fly
            </h1>
            <p className="max-w-lg text-[16px] leading-7 text-[#554336] md:text-[18px]">
              Skip the queues and enjoy a guaranteed dining experience at Karali Restaurant. Elevate your pre-flight
              routine with High-Velocity Calm.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button href="/book">Book a Table</Button>
              <Button href="/book" variant="secondary">
                View Menu
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-[#231a13] md:text-[32px]">Travel Without Compromise</h2>
          <div className="mx-auto mt-3 h-[3px] w-12 rounded-full bg-[#8f4a00]" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Card className="min-h-[160px] space-y-3">
            <div className="text-3xl text-[#8f4a00]">⚡</div>
            <h3 className="text-[20px] font-semibold">Instant Booking</h3>
            <p className="max-w-sm text-sm leading-6 text-[#554336]">
              Secure your preference in seconds with our optimized mobile flow. No confirmations required.
            </p>
          </Card>
          <Card className="min-h-[160px] space-y-3">
            <div className="text-3xl text-[#8f4a00]">⌁</div>
            <h3 className="text-[20px] font-semibold">QR Entry</h3>
            <p className="max-w-sm text-sm leading-6 text-[#554336]">
              Check-in at the restaurant using your digital pass for seamless arrival.
            </p>
          </Card>
          <Card className="min-h-[160px] space-y-3 md:col-span-2 xl:col-span-1">
            <div className="text-3xl text-[#8f4a00]">◌</div>
            <h3 className="text-[20px] font-semibold">No Waiting</h3>
            <p className="max-w-sm text-sm leading-6 text-[#554336]">
              Your table is held exclusively for you, regardless of terminal traffic.
            </p>
          </Card>
          <Card className="min-h-[160px] space-y-3">
            <div className="text-3xl text-[#8f4a00]">◎</div>
            <h3 className="text-[20px] font-semibold">Secure Payment</h3>
            <p className="max-w-sm text-sm leading-6 text-[#554336]">
              One-click checkout with encrypted processing for frequent travelers.
            </p>
          </Card>
          <Card className="min-h-[160px] space-y-3">
            <div className="text-3xl text-[#8f4a00]">↻</div>
            <h3 className="text-[20px] font-semibold">Real-Time</h3>
            <p className="max-w-sm text-sm leading-6 text-[#554336]">
              Live seat availability synced with flight departure schedules.
            </p>
          </Card>
        </div>
      </section>

      <section className="rounded-[32px] bg-[#f3e1d5] px-6 py-12 md:px-10">
        <h3 className="mb-8 text-center text-lg font-medium text-[#554336]">Three Steps to Elegance</h3>
        <div className="grid gap-8 md:grid-cols-3">
          {[
            ["1", "Book", "Select your arrival time and group size on our concierge app."],
            ["2", "Get QR", "Receive your personalized dining pass instantly via email or SMS."],
            ["3", "Dine", "Walk straight to your reserved seat and enjoy artisanal luxury."],
          ].map(([n, title, copy]) => (
            <div key={n} className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#8f4a00] text-lg font-bold text-white">
                {n}
              </div>
              <h4 className="mt-5 text-lg font-medium text-[#231a13]">{title}</h4>
              <p className="mx-auto mt-2 max-w-[240px] text-sm leading-6 text-[#554336]">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-[#8f4a00]">Atmosphere</p>
            <h3 className="mt-1 text-3xl font-bold text-[#231a13]">Designed for the Discerning</h3>
          </div>
          <button className="text-sm font-medium text-[#8f4a00]">View full gallery →</button>
        </div>
        <div className="grid gap-4 lg:grid-cols-4 lg:grid-rows-2">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBfby72kp4rLdO76c2yK4sZ0z6ALVrbZ4R0ZXwKBi8nCZoygq5t9ol6rK0fhXYs5vdVFz2KzWNpsvK6aUv1sB7fDtDCcZ5hbBQa7C1eg8S8e2XX6hqNLeiLq9AFoS4xulGRHppnIeMwsPQuDxX4mZ--6xHl3ORc7oFwmrjVOssekaeZlLUJUr1hUNz5Ch_5fmHCmPq6K8zhImdBbV2DR0pWJaWoZuS-Auhs08cz6mxdGQyPS7-c4eEnhJVeQ7IiF_LexkBkHpOjAiLtVwfDaLGoI"
            className="h-full min-h-[280px] w-full rounded-[28px] object-cover lg:col-span-2 lg:row-span-2"
            alt="Dining dish"
          />
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuB1owAmzqKECBqiOdSUmoX4d2iJZWnodIZI8TcobMBJeJYABYkl3eUb7P-6RaJbdKMi5NysPc8J0Q8EDEz3jTuHDlCVjkebnVxUFC9pZapcViH1GlhesHhw7Z-fZtg0nOJdJoVOjdGIvi3CQaHjxk4dp9s_4nZxjNsyr8HycxByjfoAZF0wLOVqsSqc7yDq991nm4tWKYFw-Iqq9noeMXQYZKHWx5igRskL4Hq0DT1q7hPjS8RlFRsgoxPTd1NFR8PmKB1hd5VefmUP"
            className="h-full min-h-[130px] w-full rounded-[28px] object-cover"
            alt="Booth"
          />
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBJUaMP1RacVyJWN7R9yikMOrpjYMm_fdrYQBSIhZD5jlJKEjzfFgXDxiwCQVguR30QjcF3-L-W-nrWGrRVxCCU7MgdhBDsyDNqIdfaNogsrKNnfD1Zg1_tedY1lg8un17jMf_FDpTtmaO7Wxn5zc9ShUuMp2HL68HY7quuXr6xFuDlOwI5a62eLrM6Hd52LhpbE0uew7hI9-RbWVvmVmSStHb8WCFdZ3ubOYZ-JJeU5YQp5QZCrOwqaEhiJtl5_cbAREibm9sE-hY3"
            className="h-full min-h-[130px] w-full rounded-[28px] object-cover"
            alt="Bar"
          />
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCikEDK1YnhQRIMa0NbC0Oy0txOxh6pEC00XCJr209QbWJu_BpILwplNZnpc-cnL7wCv-0UtCH9ECr-2ycbeyqaD5PiB2JnfomvS0EGIdtF6srd2HHPFUn-TBHCFVZFX6ulcxfZZ0Lg9hZ7XLUbC0AeNGaq7x8PG-DT_pnd59psH5zQ__phpdWSK1joO2ULcmB9FojXJBBLpqbR0Em42b6QTJ8Lk0JB68ihDm3Jzwdz5pl21OT6mYvlVRLrUy70c7T063W7hxT1W-JN"
            className="h-full min-h-[130px] w-full rounded-[28px] object-cover lg:col-span-2"
            alt="Interior"
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <h3 className="text-3xl font-bold text-[#231a13]">Loved by Global Travelers</h3>
          <div className="flex items-center gap-1 text-[#ffba27]">★★★★★ <span className="ml-2 text-sm text-[#554336]">4.9/5 Average Rating</span></div>
          <p className="max-w-md text-[18px] leading-8 text-[#554336]">
            We take pride in turning the stress of travel into moments of culinary delight.
          </p>
        </div>
        <div className="space-y-4">
          {[
            [
              "“Finally, a restaurant that understands the value of a traveler's time. The booking was flawless and the saffron-infused risotto was world-class.”",
              "JD",
              "Julian De Silva",
              "Executive Platinum Member",
            ],
            [
              "“Karali has changed how I view airport food. It's no longer a compromise; it's a destination. The QR check-in took less than 10 seconds.”",
              "SM",
              "Sarah Miller",
              "London Heathrow Commuter",
            ],
          ].map(([quote, initials, name, role]) => (
            <Card key={name} className="space-y-4">
              <p className="italic text-[#554336]">{quote}</p>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ffdcc4] text-sm font-bold text-[#8f4a00]">
                  {initials}
                </div>
                <div>
                  <div className="font-medium text-[#231a13]">{name}</div>
                  <div className="text-xs text-[#554336]">{role}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="text-center">
        <h3 className="text-3xl font-bold text-[#231a13]">Join the Inner Circle</h3>
        <p className="mx-auto mt-3 max-w-2xl text-[18px] leading-8 text-[#554336]">
          Get exclusive access to seasonal menu reveals and priority booking windows for peak travel seasons.
        </p>
        <form className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
          <input className="h-12 flex-1 rounded-full border border-white/20 bg-white px-5 outline-none" placeholder="Enter your email" />
          <Button type="button">Subscribe</Button>
        </form>
      </section>
    </div>
  );
}
