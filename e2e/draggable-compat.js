import Draggable from '../src/main';
import { mousedown, mousemove, mouseup, touchstart, touchmove, touchend, gesturestart, gesturemove } from './util';

describe('Draggable with Mouse and Touch events fallback', () => {
    let el;
    let draggable;
    let handler;
    const supportFn = Draggable.supportPointerEvent;

    beforeEach(() => {
        el = document.createElement("div");
        document.body.appendChild(el);
        Draggable.supportPointerEvent = () => false;
    });

    afterEach(() => {
        draggable && draggable.destroy();
        document.body.removeChild(el);
        Draggable.supportPointerEvent = supportFn;
    });

    describe("Press", () => {
        beforeEach(() => {
            handler = jasmine.createSpy("onPress");

            draggable = new Draggable({
                press: handler
            });

            draggable.bindTo(el);
        });

        it('executes press with coordinates on mousedown', () => {
            mousedown(el, 100, 200);

            const args = handler.calls.mostRecent().args[0];

            expect(args.pageX).toEqual(100);
            expect(args.pageY).toEqual(200);
        });

        it("isTouch is false for mouse events", () => {
            mousedown(el, 100, 200);

            const args = handler.calls.mostRecent().args[0];

            expect(args.isTouch).toBeFalsy();
        });

        it('executes press with key modifiers on mousedown', () => {
            mousedown(el, 100, 200);

            const args = handler.calls.mostRecent().args[0];

            expect(args.shiftKey).toBe(false);
            expect(args.ctrlKey).toBe(false);
            expect(args.altKey).toBe(false);
        });

        it('executes press with originalEvent on mousedown', () => {
            mousedown(el, 100, 200);

            const args = handler.calls.mostRecent().args[0];

            expect(args.originalEvent instanceof MouseEvent).not.toBeFalsy();
        });

        it("executes press with coordinates on touchstart", () => {
            touchstart(el, 100, 200);

            const args = handler.calls.mostRecent().args[0];

            expect(args.pageX).toEqual(100);
            expect(args.pageY).toEqual(200);
        });

        it("isTouch is true for touch events", () => {
            touchstart(el, 100, 200);

            const args = handler.calls.mostRecent().args[0];

            expect(args.isTouch).toBe(true);
        });

        it("executes press with originalEvent on touchstart", () => {
            touchstart(el, 100, 200);

            const args = handler.calls.mostRecent().args[0];

            expect(args.originalEvent instanceof TouchEvent).not.toBeFalsy();
        });

        it("ignores multi touches", () => {
            touchstart(el, 100, 200);
            gesturestart(el, 100, 200, 101, 201);

            expect(handler).toHaveBeenCalledTimes(1);
        });

        it('ignores right click', () => {
            mousedown(el, 100, 200, 2);
            expect(handler.calls.count()).toEqual(0);
        });
    });

    describe("Mouse Drag", () => {
        beforeEach(() => {
            handler = jasmine.createSpy("onDrag");

            draggable = new Draggable({
                drag: handler
            });

            draggable.bindTo(el);

            mousedown(el, 100, 200);
            mousemove(el, 101, 201);
        });

        it("triggers drag for down + move", () => {
            expect(handler).toHaveBeenCalled();
        });

        it("stops listening when released", () => {
            mouseup(el, 101, 201);
            mousemove(el, 101, 201);

            expect(handler).toHaveBeenCalledTimes(1);
        });

        it('normalizes clientX and clientY', () => {
            const args = handler.calls.argsFor(0)[0];
            
            expect(args.clientX).toBe(101);
            expect(args.clientY).toBe(201);
        });
    });

    describe("Touch drag", () => {
        beforeEach(() => {
            handler = jasmine.createSpy("onDrag");

            draggable = new Draggable({
                drag: handler
            });

            draggable.bindTo(el);

            touchstart(el, 100, 200);
            touchmove(el, 101, 201);
        });

        it("triggers drag for down + move", () => {
            expect(handler).toHaveBeenCalled();
        });

        it("disposes drag handlers properly", () => {
            draggable.destroy();
            draggable = null;

            touchmove(el, 101, 201);

            expect(handler).toHaveBeenCalledTimes(1);
        });

        it("ignores gestures", () => {
            gesturemove(el, 101, 201, 102, 202);
            expect(handler).toHaveBeenCalledTimes(1);
        });

        it('normalizes clientX and clientY', () => {
            const args = handler.calls.argsFor(0)[0];
            expect(args.clientX).toBe(101);
            expect(args.clientY).toBe(201);
        });
    });

    describe("Mouse up", () => {
        it("triggers release", () => {
            handler = jasmine.createSpy("onRelease");

            draggable = new Draggable({
                release: handler
            });

            draggable.bindTo(el);

            mousedown(el, 99, 200);
            mousemove(el, 101, 201);
            mouseup(el, 101, 201);
            expect(handler).toHaveBeenCalled();
        });
    });

    describe("Touch end", () => {
        beforeEach(() => {
            handler = jasmine.createSpy("onRelease");

            draggable = new Draggable({
                release: handler
            });

            draggable.bindTo(el);

            touchstart(el, 100, 200);
            touchmove(el, 101, 201);
            touchend(el, 101, 201);
        });

        it("triggers release on touchend", () => {
            expect(handler).toHaveBeenCalled();
        });

        it("disposes drag handlers properly", () => {
            draggable.destroy();
            draggable = null;

            touchend(el, 101, 201);

            expect(handler).toHaveBeenCalledTimes(1);
        });
    });

    describe('Emulated mouse events', () => {
        it("ignores mouse after touch", () => {
            handler = jasmine.createSpy("onPress");

            draggable = new Draggable({
                press: handler,
                release: handler
            });

            draggable.bindTo(el);

            // mouse events are triggered
            touchstart(el, 100, 200);
            touchend(el, 100, 200);
            mousedown(el, 100, 200);
            mouseup(el, 100, 200);

            expect(handler).toHaveBeenCalledTimes(2);
        });

        it("restores mouse listeners after a while", () => {
            const clock = jasmine.clock();
            clock.install();
            handler = jasmine.createSpy("onPress");

            draggable = new Draggable({
                press: handler,
                release: handler
            });

            draggable.bindTo(el);

            // mouse events are triggered
            touchstart(el, 100, 200);
            touchend(el, 100, 200);
            clock.tick(20000);
            mousedown(el, 100, 200);
            mouseup(el, 100, 200);

            expect(handler).toHaveBeenCalledTimes(4);
            clock.uninstall();
        });
    });

    describe("with mouseOnly set to true", () => {
        beforeEach(() => {
            handler = jasmine.createSpy("onPress");

            draggable = new Draggable({
                press: handler,
                mouseOnly: true
            });

            draggable.bindTo(el);
        });

        it("emits press on mousedown", () => {
            mousedown(el, 100, 200);

            expect(handler).toHaveBeenCalled();
        });

        it("does not emit press on touchstart", () => {
            touchstart(el, 100, 200);

            expect(handler).not.toHaveBeenCalled();
        });
    });
});
