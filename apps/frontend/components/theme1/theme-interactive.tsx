"use client";

import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";

export function VideoLightbox({ href }: { href: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <a
        className="vimeo video_button"
        href={href}
        onClick={(event) => {
          event.preventDefault();
          setOpen(true);
        }}
      >
        <i className="fa fa-play" aria-hidden="true"></i>
      </a>
      {open ? (
        <div className="theme-video-modal" onClick={() => setOpen(false)}>
          <div className="theme-video-dialog" onClick={(event) => event.stopPropagation()}>
            <button className="theme-video-close" type="button" onClick={() => setOpen(false)}>
              ×
            </button>
            <iframe
              src={href}
              title="Theme 1 video"
              allow="autoplay; fullscreen"
              allowFullScreen
              loading="lazy"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

export function AccordionsAndTabs() {
  const [openIndexes, setOpenIndexes] = useState([0]);
  const [tab, setTab] = useState(0);
  const panels = useMemo(
    () => [
      {
        title: "Lorem ipsum dolor sit amet, consectetur adipiscing elit",
        body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec malesuada lorem maximus mauris scelerisque, at rutrum nulla dictum. Ut ac ligula sapien. Suspendisse cursus faucibus finibus. Ut non justo eleifend, facilisis nibh ut, interdum odio. Suspendisse potenti.",
      },
      {
        title: "Morbi in urna commodo, cursus ante at, facilisis augue",
        body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec malesuada lorem maximus mauris scelerisque, at rutrum nulla dictum. Ut ac ligula sapien. Suspendisse cursus faucibus finibus. Ut non justo eleifend, facilisis nibh ut, interdum odio. Suspendisse potenti.",
      },
      {
        title: "Lorem ipsum dolor sit amet, consectetur adipiscing elit",
        body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec malesuada lorem maximus mauris scelerisque, at rutrum nulla dictum. Ut ac ligula sapien. Suspendisse cursus faucibus finibus. Ut non justo eleifend, facilisis nibh ut, interdum odio. Suspendisse potenti.",
      },
    ],
    [],
  );

  return (
    <div className="accordions_and_tabs">
      <div className="elements_title">Accordions &amp; Tabs</div>
      <div className="row accordions_and_tabs_row">
        <div className="col-lg-6">
          <div className="accordions">
            {panels.map((panel, index) => {
              const open = openIndexes.includes(index);
              return (
                <div key={`${panel.title}-${index}`} className="accordion_container">
                  <div
                    className={`accordion d-flex flex-row align-items-center${open ? " active" : ""}`}
                    onClick={() =>
                      setOpenIndexes((current) => (current.includes(index) ? current.filter((item) => item !== index) : [...current, index]))
                    }
                  >
                    <div>{panel.title}</div>
                  </div>
                  <div className="accordion_panel" style={{ maxHeight: open ? 240 : 0 }}>
                    <div>
                      <p>{panel.body}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="col-lg-6">
          <div className="tabs">
            <div className="tabs d-flex flex-row align-items-center justify-content-start flex-wrap">
              {["Lorem ipsum dolor", "Morbi in urna", "Lorem ipsum"].map((item, index) => (
                <div key={item} className={`tab${tab === index ? " active" : ""}`} onClick={() => setTab(index)}>
                  {item}
                </div>
              ))}
            </div>
            <div className="tab_panels">
              <div className={`tab_panel${tab === 0 ? " active" : ""}`}>
                <div className="tab_panel_content d-flex flex-row align-items-start justify-content-start">
                  <div>
                    <div className="tab_image">
                      <img src="/theme1/images/tab.jpg" alt="" />
                    </div>
                  </div>
                  <div className="tab_text">
                    <p>{panels[0].body}</p>
                  </div>
                </div>
              </div>
              <div className={`tab_panel${tab === 1 ? " active" : ""}`}>
                <div className="tab_panel_content">
                  <div className="tab_text">
                    <p>{panels[1].body}</p>
                  </div>
                </div>
              </div>
              <div className={`tab_panel${tab === 2 ? " active" : ""}`}>
                <div className="tab_panel_content">
                  <div className="tab_text">
                    <p>{panels[2].body}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AnimatedCircle({ value, title }: { value: number; title: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        const start = performance.now();
        const duration = 1400;
        const animate = (time: number) => {
          const fraction = Math.min((time - start) / duration, 1);
          setProgress(value * fraction);
          if (fraction < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
        observer.disconnect();
      },
      { threshold: 0.3 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div ref={ref} className="loader_container text-center">
      <div className="loader text-center">
        <svg viewBox="0 0 120 120" className="theme-loader-svg" aria-hidden="true">
          <circle cx="60" cy="60" r={radius} className="theme-loader-track" />
          <circle
            cx="60"
            cy="60"
            r={radius}
            className="theme-loader-progress"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: circumference * (1 - progress),
            }}
          />
        </svg>
        <span className="theme-loader-label">{Math.round(progress * 100)}%</span>
      </div>
      <div className="loader_content">
        <div className="loader_title">{title}</div>
      </div>
    </div>
  );
}

export function AnimatedMilestone({ value, children }: { value: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        const start = performance.now();
        const duration = 1600;
        const animate = (time: number) => {
          const fraction = Math.min((time - start) / duration, 1);
          setCount(Math.round(value * fraction));
          if (fraction < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
        observer.disconnect();
      },
      { threshold: 0.4 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [value]);

  return (
    <>
      <div ref={ref} className="milestone_counter">
        {count}
      </div>
      {children}
    </>
  );
}
