import Draggable from '../src/main';
import { pointerdown, pointermove, pointerup, pointercancel } from './pointer-util';
import { aMouseEvent } from './util';

describe('Draggable with Pointer events', () => {
    let el;
    let anotherEl;
    let draggable;
    let handler;

    if (!window.PointerEvent) {
        return;
    }

    beforeEach(() => {
        el = document.createElement("div");
        anotherEl = document.createElement("div");
        document.body.appendChild(el);
        document.body.appendChild(anotherEl);
    });

    afterEach(() => {
        draggable && draggable.destroy();
        document.body.removeChild(el);
        document.body.removeChild(anotherEl);
    });

    describe("Press", () => {
        beforeEach(() => {
            handler = jasmine.createSpy("onPress");

            draggable = new Draggable({
                press: handler
            });

            draggable.bindTo(el);
        });

        it("executes press with coordinates on pointerdown", () => {
            pointerdown(el, 100, 200);

            const args = handler.calls.mostRecent().args[0];

            expect(args.pageX).toEqual(100);
            expect(args.pageY).toEqual(200);
        });

        it("isTouch is false for pointer events", () => {
            pointerdown(el, 100, 200);

            const args = handler.calls.mostRecent().args[0];

            expect(args.isTouch).toBeFalsy();
        });

        it("does not execute press if the left button is not clicked", () => {
            pointerdown(el, 100, 200, true, 2);

            expect(handler).not.toHaveBeenCalled();
        });

        it("executes press with originalEvent on pointerdown", () => {
            pointerdown(el, 100, 200);

            const args = handler.calls.mostRecent().args[0];

            expect(args.originalEvent instanceof PointerEvent).toBeTruthy();
        });

        it("ignores multi touches", () => {
            pointerdown(el, 100, 200);
            pointerdown(el, 100, 200, false);

            expect(handler).toHaveBeenCalledTimes(1);
        });
    });

    describe("Drag", () => {
        const drag = () => {
            pointerdown(el, 100, 200);
            pointermove(el, 101, 201);
        };

        beforeEach(() => {
            handler = jasmine.createSpy("onDrag");

            draggable = new Draggable({
                drag: handler
            });

            draggable.bindTo(el);
        });

        it("triggers drag from outside element", () => {
            pointerdown(el, 100, 200);
            pointermove(anotherEl, 101, 201);

            expect(handler).toHaveBeenCalled();
        });

        // it("triggers drag when children of element reorders and move outside of container", () => {
               // can't be tested because browser is responsible for handling
               // pointerCapture.
        //     const child1 = document.createElement("div");
        //     const child2 = document.createElement("div");

        //     el.appendChild(child1);
        //     el.appendChild(child2);

        //     pointerdown(el, 100, 200);
        //     pointermove(anotherEl, 101, 201);

        //     el.insertBefore(child2, child1);

        //     pointermove(anotherEl, 700, 202);

        //     expect(handler).toHaveBeenCalledTimes(2);
        // });

        it("triggers drag for down + move", () => {
            drag();
            expect(handler).toHaveBeenCalled();
        });

        it("executes drag with offset on pointermove", () => {
            drag();
            const args = handler.calls.mostRecent().args[0];

            expect(100 - Math.abs(args.offsetX)).toBeLessThan(10);
            expect(200 - Math.abs(args.offsetY)).toBeLessThan(10);
        });

        it("disposes drag handlers properly", () => {
            drag();
            draggable.destroy();
            draggable = null;

            pointermove(el, 101, 201);

            expect(handler).toHaveBeenCalledTimes(1);
        });

        it("does not trigger drag before press", () => {
            pointermove(el, 101, 201);
            expect(handler).not.toHaveBeenCalled();
        });

        it('normalizes clientX and clientY', () => {
            drag();

            const args = handler.calls.argsFor(0)[0];
            expect(args.clientX).toBe(101);
            expect(args.clientY).toBe(201);
        });
    });

    describe("Release", () => {
        beforeEach(() => {
            handler = jasmine.createSpy("onRelease");

            draggable = new Draggable({
                release: handler
            });

            draggable.bindTo(el);
        });

        it("triggers release on pointerup", () => {
            pointerdown(el, 100, 200);
            pointermove(el, 101, 201);
            pointerup(el, 101, 201);

            expect(handler).toHaveBeenCalledTimes(1);
        });

        it("does not triggers release on pointerup if not primary", () => {
            pointerdown(el, 100, 200);
            pointermove(el, 101, 201);
            pointerup(el, 101, 201, false);

            expect(handler).not.toHaveBeenCalled();
        });

        it("triggers release on pointercancel", () => {
            pointerdown(el, 100, 200);
            pointercancel(el, 101, 201);
            pointercancel(el, 101, 201);

            expect(handler).toHaveBeenCalledTimes(1);
        });

        it("does not triggers release on pointercancel if not primary", () => {
            pointerdown(el, 100, 200);
            pointermove(el, 101, 201);
            pointercancel(el, 101, 201, false);

            expect(handler).not.toHaveBeenCalled();
        });

        it("does not trigger release if the element was not pressed", () => {
            pointerup(el, 100, 200);
            expect(handler).not.toHaveBeenCalled();
        });

        it("disposes drag handlers properly", () => {
            draggable.destroy();
            draggable = null;

            pointerdown(el, 100, 200);
            pointermove(el, 101, 201);
            pointerup(el, 101, 201);

            const contextmenu = new Event('contextmenu', {
                bubbles: true
            });
            spyOn(contextmenu, 'preventDefault');

            el.dispatchEvent(contextmenu);

            expect(contextmenu.preventDefault).not.toHaveBeenCalled();
            expect(handler).not.toHaveBeenCalled();
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

        it("does not emit press on pointerdown", () => {
            pointerdown(el, 100, 200);

            expect(handler).not.toHaveBeenCalled();
        });
    });

    describe("contextmenu", () => {
        beforeEach(() => {
            draggable = new Draggable({});

            draggable.bindTo(el);
        });

        it('prevents contextmenu while dragging', () => {
            pointerdown(el, 100, 200);

            const e = aMouseEvent('contextmenu');
            spyOn(e, 'preventDefault');

            el.dispatchEvent(e);

            expect(e.preventDefault).toHaveBeenCalledTimes(1);


            pointerup(el, 100, 200);
        });

        it('does not prevent contextmenu after release', () => {
            pointerdown(el, 100, 200);
            pointerup(el, 100, 200);

            const e = aMouseEvent('contextmenu');
            spyOn(e, 'preventDefault');

            el.dispatchEvent(e);

            expect(e.preventDefault).not.toHaveBeenCalled();
        });
    });
});

