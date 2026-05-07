import { AsciiTextReveal } from "@/components/AsciiTextReveal";
import { ModeToggle } from "@/components/ModeToggle";
import { ProjectMarquee, type MarqueeItem } from "@/components/ProjectMarquee";

const MARQUEE: MarqueeItem[] = [
  { src: "/projects/slide-3.png", alt: "slide-3", width: 480 },
  { src: "/projects/slide-4.png", alt: "slide-4", width: 500 },
  { src: "/projects/slide-6.png", alt: "slide-6", width: 360 },
  { src: "/projects/slide-7.png", alt: "slide-7", width: 480 },
  { src: "/projects/slide-8.png", alt: "slide-8", width: 480 },
  { src: "/projects/slide-9.png", alt: "slide-9", width: 360 },
  { src: "/projects/awning-2.png", alt: "awning", width: 640 },
  { src: "/projects/monument-1.png", alt: "monument", width: 640 },
  { src: "/projects/nezzo-1.png", alt: "nezzo", width: 640 },
  { src: "/projects/shake.png", alt: "shake", width: 640 },
];

export default function HumanHome() {
  return (
    <>
      <AsciiTextReveal>
        <section className="info-grid" id="site-copy" aria-label="Portfolio introduction">
          <div className="panel panel-intro">
            <p className="name">Ryan Lasswell</p>
            <p className="panel-role">Designer. Director. Builder.</p>
            <p className="panel-copy panel-intro-body">
              Creating digital products, brands and systems for AI-native companies.
            </p>
          </div>

          <div className="panel panel-services" data-extra>
            <h2 className="panel-title">Services</h2>
            <ul className="panel-list">
              <li>Product Design</li>
              <li>Design Engineering</li>
              <li>Interaction Design</li>
              <li>Design Systems</li>
              <li>Creative Direction</li>
              <li>Brand Identity</li>
            </ul>
          </div>

          <div className="panel panel-contact" data-extra>
            <h2 className="panel-title">Contact</h2>
            <ul className="panel-list">
              <li>Follow</li>
              <li>Calendar</li>
              <li>
                <a href="mailto:hello@ryanlass.co">Email</a>
              </li>
            </ul>
          </div>

          <div className="panel panel-modes" data-extra>
            <ModeToggle variant="human" layout="panel" />
          </div>
        </section>
      </AsciiTextReveal>

      <ProjectMarquee items={MARQUEE} />
    </>
  );
}
