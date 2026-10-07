"use client";

import { Display } from "@/components/brand";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { FAQ } from "@/lib/home-content";

export function Faq() {
  return (
    <section id="faq" data-section="faq" className="mx-auto max-w-[900px] px-6 py-24 scroll-mt-20">
      <Display as="h2" className="text-[clamp(1.8rem,4vw,3rem)]">Frequently asked.</Display>
      <Accordion multiple={false} className="mt-8 w-full">
        {FAQ.map((f, i) => (
          <AccordionItem key={i} value={`q${i}`} className="border-b border-border">
            <AccordionTrigger className="py-4 text-left text-base font-medium tracking-tight hover:no-underline">
              {f.q}
            </AccordionTrigger>
            <AccordionContent className="pb-4 text-sm leading-relaxed text-muted-foreground">
              {f.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
