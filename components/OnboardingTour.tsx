"use client";

import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { markTourSeen } from "@/app/actions/tour";

export default function OnboardingTour({ show }: { show: boolean }) {
  useEffect(() => {
    if (!show) return;

    const driverObj = driver({
      animate: true,
      smoothScroll: true,
      showProgress: true,
      progressText: "{{current}} / {{total}}",
      popoverClass: "pis-tour-popover",
      doneBtnText: "Let's Build →",
      nextBtnText: "Next →",
      prevBtnText: "← Back",
      onHighlightStarted: (_el, step) => {
        if (step?.popover?.title === "Dash: Your AI Agent") {
          const fab = document.querySelector("[data-tour='dash-fab']") as HTMLElement | null;
          if (fab) fab.classList.add("tour-pulse");
        }
      },
      onDeselected: (_el, step) => {
        if (step?.popover?.title === "Dash: Your AI Agent") {
          const fab = document.querySelector("[data-tour='dash-fab']") as HTMLElement | null;
          if (fab) fab.classList.remove("tour-pulse");
        }
      },
      onDestroyStarted: async () => {
        // Remove pulse in case tour was closed on the Dash step
        const fab = document.querySelector("[data-tour='dash-fab']") as HTMLElement | null;
        if (fab) fab.classList.remove("tour-pulse");
        driverObj.destroy();
        await markTourSeen();
      },
      steps: [
        {
          element: "[data-tour='sidebar-nav']",
          popover: {
            title: "Navigation",
            description: "Browse your projects, completed tasks, and personal link library from here.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "[data-tour='links-nav']",
          popover: {
            title: "Your Link Library",
            description: "Save any URL (YouTube videos, articles, tweets) to your personal library. Review them later or use them to kick off a new project.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "[data-tour='skills-nav']",
          popover: {
            title: "Dash Skills",
            description: "Create custom skills that extend Dash's capabilities. Each skill has a /command — type it at the start of a message and Dash reads the skill and applies it. Any AI connected via MCP can create skills too.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "[data-tour='sort-controls']",
          popover: {
            title: "Sort Your Projects",
            description: "Sort by urgency level, creation date, or drag them into your own custom order.",
            side: "bottom",
            align: "start",
          },
        },
        {
          element: "[data-tour='project-cards']",
          popover: {
            title: "Project Cards",
            description: "Each card shows priority, progress, steps, and the last session. Click to expand, or click the title area to open the full project view.",
            side: "bottom",
            align: "start",
          },
        },
        {
          element: "[data-tour='dash-fab']",
          popover: {
            title: "Dash: Your AI Agent",
            description: "Click here to open Dash. Describe any project idea and Dash will plan it, create all the steps, and log the session. You have 20 messages as a guest.",
            side: "left",
            align: "end",
          },
        },
        {
          popover: {
            title: "One System. Any AI.",
            description: "Dash is the bootstrapper. Describe an idea and it scaffolds the full plan in seconds: steps, context, logs, everything structured in the database.\n\nThe real power? Any AI can plug in via the Supabase MCP and read your full project state. Claude, Cursor, Windsurf, they all connect to the same data. Switch tools mid-project. Bring in a specialist AI for one task. Come back a month later and every AI picks up exactly where you left off.\n\nNo copy-pasting context. No starting over. The database is the interface.",
            align: "center",
          },
        },
      ],
    });

    // Small delay to let the page render before starting
    const timeout = setTimeout(() => driverObj.drive(), 800);
    return () => clearTimeout(timeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
