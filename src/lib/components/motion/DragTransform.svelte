<script>
    import Box from "../Box.svelte";
    import { Motion, useTransform, useMotionValue } from "$lib/motion-start";
    let x = useMotionValue(0);
    let scale = useTransform(x, [-150, 0, 150], [1.5, 1, 0.4]);
    let rotate = useTransform(x, [-150, 0, 150], [-120, 0, 120]);
    // let borderRadius = useTransform(x, [-150, 0, 150], [50, 50, 100]);
</script>

<Box cls="bg-slate-800 text-black" minHeight={350}>
    <Motion.div
        style={{
            x,
            scale,
            rotate,
        }}
        drag="x"
        dragConstraints={{
            right: 0,
            left: 0,
        }}
        dragTransition={{
            bounceStiffness: 600,
            bounceDamping: 20,
        }}
        whileTap={{
            cursor: "grabbing",
        }}
        class="box relative"
    >
        Drag
        <div class="absolute left-1">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#00133D"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-chevron-left"
                ><path d="m15 18-6-6 6-6" /></svg
            >
        </div>
        <div class="absolute right-1">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#00133D"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-chevron-right"
                ><path d="m9 18 6-6-6-6" /></svg
            >
        </div>
    </Motion.div>
</Box>
