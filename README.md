# Wall Calendar - Project Report

Hey! This is my submission for the TakeUforward frontend internship task. I wanted to build something that didn't just look like a "web calendar" but felt like a physical object you'd have on your desk. I focused heavily on the tactile feel—the flip of the paper, the light hitting the glass, and the way colors shift with the seasons.

## The Design Philosophy

Instead of using a UI library like Material or Bootstrap, I decided to go with **Glassmorphism and Paper Textures**. I used a subtle noise overlay on the calendar pages to make them feel like real paper, and a heavy backdrop blur on the calendar shell so the animated background "bleeds" through the card.

For typography, I paired **Cormorant Garamond** (which has that classy, editorial feel) with **DM Sans** for the UI elements. I think this contrast makes it look like a premium physical product.

## Key Technical Challenges

### 1. The Spiral Binding (SVG + Masking)
I didn't want the binding to be a simple image. I built it using a custom SVG with a **real transparency mask**. The holes you see at the top are actually "punched" through the metallic bar using an SVG mask. This means if you change the site background, you can actually see the background colors through the holes of the calendar. It’s a small detail, but it makes the whole thing feel grounded in the 3D space.

### 2. High-Performance Page Flips
Handling 3D rotations in React can be tricky. I used a `transform-origin: top center` approach to make the page "peel" off the spiral. The easing isn't a standard "ease-out"—I used a specific cubic-bezier curve to give it that "snap" you feel when you flip a heavy page. I also added a "darkening" overlay that animates during the flip to simulate how light falls into the crease of the paper.

### 3. Smart Image Loading & Caching
One of the biggest issues I ran into was images "flashing" or resetting after a flip. I solved this by building a global **image cache** in the main component. When you navigate to a month, the app pre-loads the next month's image in the background. Once it's in the cache, it stays there. This means no more white flashes or broken images when you're flipping through the year.

### 4. Interactive Range Selection
The range picker was built from scratch. I implemented a **hover-preview logic** where, once you click a start date, the calendar tracks your mouse and "paints" a preview of the trail. I used a custom CSS grid system to handle the "strip" highlight so it looks continuous even across different weeks.

## Tech Stack & Why

- **React + Vite**: Vite is incredibly fast for CSS-heavy projects. The Hot Module Replacement (HMR) allowed me to tweak the 3D flip colors in real-time.
- **Raw CSS**: I avoided Tailwind because I needed very specific control over the CSS Grid and 3D animations. Raw CSS allowed me to use variables like `--accent` to change the entire site's theme dynamically based on the month.
- **LocalStorage**: I implemented a persistent notes system that saves your data to the browser. I added a "flash" saved indicator to give users some feedback when they hit Ctrl+Enter.

## Running it locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be live at `http://localhost:5173`.

## Final Thoughts
This was a really fun challenge. It forced me to think about how 2D web elements can mimic 3D physical objects. If I had more time, I’d love to add touch-swipe support for mobile users, but for now, the keyboard arrows and buttons provide a solid navigation experience.

Thanks for checking it out!
