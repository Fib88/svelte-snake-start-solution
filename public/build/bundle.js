
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.22.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/SnakeBody.svelte generated by Svelte v3.22.2 */

    const file = "src/SnakeBody.svelte";

    // (10:2) {#if isHead}
    function create_if_block(ctx) {
    	let div0;
    	let t;
    	let div1;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t = space();
    			div1 = element("div");
    			attr_dev(div0, "id", "leftEye");
    			attr_dev(div0, "class", "eyes svelte-x9hdbn");
    			add_location(div0, file, 10, 4, 223);
    			attr_dev(div1, "id", "rightEye");
    			attr_dev(div1, "class", "eyes svelte-x9hdbn");
    			add_location(div1, file, 11, 4, 261);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, div1, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(10:2) {#if isHead}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div;
    	let div_class_value;
    	let if_block = /*isHead*/ ctx[3] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			set_style(div, "left", /*left*/ ctx[1] + "px");
    			set_style(div, "top", /*top*/ ctx[0] + "px");
    			attr_dev(div, "class", div_class_value = "snake-body " + /*direction*/ ctx[2] + " svelte-x9hdbn");
    			add_location(div, file, 8, 0, 131);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*isHead*/ ctx[3]) {
    				if (if_block) ; else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*left*/ 2) {
    				set_style(div, "left", /*left*/ ctx[1] + "px");
    			}

    			if (dirty & /*top*/ 1) {
    				set_style(div, "top", /*top*/ ctx[0] + "px");
    			}

    			if (dirty & /*direction*/ 4 && div_class_value !== (div_class_value = "snake-body " + /*direction*/ ctx[2] + " svelte-x9hdbn")) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { top = 50 } = $$props;
    	let { left = 50 } = $$props;
    	let { direction = "right" } = $$props;
    	let { isHead = false } = $$props;
    	const writable_props = ["top", "left", "direction", "isHead"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SnakeBody> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("SnakeBody", $$slots, []);

    	$$self.$set = $$props => {
    		if ("top" in $$props) $$invalidate(0, top = $$props.top);
    		if ("left" in $$props) $$invalidate(1, left = $$props.left);
    		if ("direction" in $$props) $$invalidate(2, direction = $$props.direction);
    		if ("isHead" in $$props) $$invalidate(3, isHead = $$props.isHead);
    	};

    	$$self.$capture_state = () => ({ top, left, direction, isHead });

    	$$self.$inject_state = $$props => {
    		if ("top" in $$props) $$invalidate(0, top = $$props.top);
    		if ("left" in $$props) $$invalidate(1, left = $$props.left);
    		if ("direction" in $$props) $$invalidate(2, direction = $$props.direction);
    		if ("isHead" in $$props) $$invalidate(3, isHead = $$props.isHead);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [top, left, direction, isHead];
    }

    class SnakeBody extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { top: 0, left: 1, direction: 2, isHead: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SnakeBody",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get top() {
    		throw new Error("<SnakeBody>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set top(value) {
    		throw new Error("<SnakeBody>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get left() {
    		throw new Error("<SnakeBody>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set left(value) {
    		throw new Error("<SnakeBody>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get direction() {
    		throw new Error("<SnakeBody>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set direction(value) {
    		throw new Error("<SnakeBody>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isHead() {
    		throw new Error("<SnakeBody>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isHead(value) {
    		throw new Error("<SnakeBody>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Snake.svelte generated by Svelte v3.22.2 */

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	child_ctx[4] = i;
    	return child_ctx;
    }

    // (8:0) {#each snakeBodies as snakeBody, i}
    function create_each_block(ctx) {
    	let current;

    	const snakebody = new SnakeBody({
    			props: {
    				isHead: /*i*/ ctx[4] == 0,
    				top: /*snakeBody*/ ctx[2].top,
    				left: /*snakeBody*/ ctx[2].left,
    				direction: /*direction*/ ctx[0]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(snakebody.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(snakebody, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const snakebody_changes = {};
    			if (dirty & /*snakeBodies*/ 2) snakebody_changes.top = /*snakeBody*/ ctx[2].top;
    			if (dirty & /*snakeBodies*/ 2) snakebody_changes.left = /*snakeBody*/ ctx[2].left;
    			if (dirty & /*direction*/ 1) snakebody_changes.direction = /*direction*/ ctx[0];
    			snakebody.$set(snakebody_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(snakebody.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(snakebody.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(snakebody, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(8:0) {#each snakeBodies as snakeBody, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*snakeBodies*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*snakeBodies, direction*/ 3) {
    				each_value = /*snakeBodies*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { direction } = $$props;
    	let { snakeBodies = [] } = $$props;
    	const writable_props = ["direction", "snakeBodies"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Snake> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Snake", $$slots, []);

    	$$self.$set = $$props => {
    		if ("direction" in $$props) $$invalidate(0, direction = $$props.direction);
    		if ("snakeBodies" in $$props) $$invalidate(1, snakeBodies = $$props.snakeBodies);
    	};

    	$$self.$capture_state = () => ({ SnakeBody, direction, snakeBodies });

    	$$self.$inject_state = $$props => {
    		if ("direction" in $$props) $$invalidate(0, direction = $$props.direction);
    		if ("snakeBodies" in $$props) $$invalidate(1, snakeBodies = $$props.snakeBodies);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [direction, snakeBodies];
    }

    class Snake extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { direction: 0, snakeBodies: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Snake",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*direction*/ ctx[0] === undefined && !("direction" in props)) {
    			console.warn("<Snake> was created without expected prop 'direction'");
    		}
    	}

    	get direction() {
    		throw new Error("<Snake>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set direction(value) {
    		throw new Error("<Snake>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get snakeBodies() {
    		throw new Error("<Snake>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set snakeBodies(value) {
    		throw new Error("<Snake>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Food.svelte generated by Svelte v3.22.2 */

    const file$1 = "src/Food.svelte";

    function create_fragment$2(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "food svelte-p1ib6b");
    			set_style(div, "left", /*foodLeft*/ ctx[0] + "px");
    			set_style(div, "top", /*foodTop*/ ctx[1] + "px");
    			add_location(div, file$1, 5, 0, 65);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*foodLeft*/ 1) {
    				set_style(div, "left", /*foodLeft*/ ctx[0] + "px");
    			}

    			if (dirty & /*foodTop*/ 2) {
    				set_style(div, "top", /*foodTop*/ ctx[1] + "px");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { foodLeft } = $$props;
    	let { foodTop } = $$props;
    	const writable_props = ["foodLeft", "foodTop"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Food> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Food", $$slots, []);

    	$$self.$set = $$props => {
    		if ("foodLeft" in $$props) $$invalidate(0, foodLeft = $$props.foodLeft);
    		if ("foodTop" in $$props) $$invalidate(1, foodTop = $$props.foodTop);
    	};

    	$$self.$capture_state = () => ({ foodLeft, foodTop });

    	$$self.$inject_state = $$props => {
    		if ("foodLeft" in $$props) $$invalidate(0, foodLeft = $$props.foodLeft);
    		if ("foodTop" in $$props) $$invalidate(1, foodTop = $$props.foodTop);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [foodLeft, foodTop];
    }

    class Food extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { foodLeft: 0, foodTop: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Food",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*foodLeft*/ ctx[0] === undefined && !("foodLeft" in props)) {
    			console.warn("<Food> was created without expected prop 'foodLeft'");
    		}

    		if (/*foodTop*/ ctx[1] === undefined && !("foodTop" in props)) {
    			console.warn("<Food> was created without expected prop 'foodTop'");
    		}
    	}

    	get foodLeft() {
    		throw new Error("<Food>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set foodLeft(value) {
    		throw new Error("<Food>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get foodTop() {
    		throw new Error("<Food>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set foodTop(value) {
    		throw new Error("<Food>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.22.2 */
    const file$2 = "src/App.svelte";

    function create_fragment$3(ctx) {
    	let h1;
    	let t1;
    	let main;
    	let t2;
    	let t3;
    	let h2;
    	let t4;
    	let t5;
    	let current;
    	let dispose;

    	const snake = new Snake({
    			props: {
    				snakeBodies: /*snakeBodies*/ ctx[3],
    				direction: /*direction*/ ctx[2]
    			},
    			$$inline: true
    		});

    	const food = new Food({
    			props: {
    				foodLeft: /*foodLeft*/ ctx[0],
    				foodTop: /*foodTop*/ ctx[1]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Snake Game";
    			t1 = space();
    			main = element("main");
    			create_component(snake.$$.fragment);
    			t2 = space();
    			create_component(food.$$.fragment);
    			t3 = space();
    			h2 = element("h2");
    			t4 = text("Score: ");
    			t5 = text(/*score*/ ctx[4]);
    			attr_dev(h1, "class", "svelte-1v4uswy");
    			add_location(h1, file$2, 108, 0, 2386);
    			attr_dev(main, "class", "svelte-1v4uswy");
    			add_location(main, file$2, 109, 0, 2406);
    			attr_dev(h2, "class", "svelte-1v4uswy");
    			add_location(h2, file$2, 113, 0, 2491);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, main, anchor);
    			mount_component(snake, main, null);
    			append_dev(main, t2);
    			mount_component(food, main, null);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, h2, anchor);
    			append_dev(h2, t4);
    			append_dev(h2, t5);
    			current = true;
    			if (remount) dispose();
    			dispose = listen_dev(window, "keydown", /*onKeyDown*/ ctx[5], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			const snake_changes = {};
    			if (dirty & /*snakeBodies*/ 8) snake_changes.snakeBodies = /*snakeBodies*/ ctx[3];
    			if (dirty & /*direction*/ 4) snake_changes.direction = /*direction*/ ctx[2];
    			snake.$set(snake_changes);
    			const food_changes = {};
    			if (dirty & /*foodLeft*/ 1) food_changes.foodLeft = /*foodLeft*/ ctx[0];
    			if (dirty & /*foodTop*/ 2) food_changes.foodTop = /*foodTop*/ ctx[1];
    			food.$set(food_changes);
    			if (!current || dirty & /*score*/ 16) set_data_dev(t5, /*score*/ ctx[4]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(snake.$$.fragment, local);
    			transition_in(food.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(snake.$$.fragment, local);
    			transition_out(food.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(main);
    			destroy_component(snake);
    			destroy_component(food);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(h2);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function isCollide(a, b) {
    	return !(a.top < b.top || a.top > b.top || a.left < b.left || a.left > b.left);
    }

    //checks for keyboard events
    function getDirectionFromKeyCode(keyCode) {
    	if (keyCode === 38) {
    		return "up";
    	} else if (keyCode === 39) {
    		return "right";
    	} else if (keyCode === 37) {
    		return "left";
    	} else if (keyCode === 40) {
    		return "down";
    	}

    	return false;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let foodLeft = 50;
    	let foodTop = 200;
    	let direction = "right";
    	let snakeBodies = [{ left: 100, top: 0 }, { left: 50, top: 0 }, { left: 0, top: 0 }];

    	function isGameOver() {
    		const snakeBodiesNoHead = snakeBodies.slice(1);
    		const snakeCollisions = snakeBodiesNoHead.filter(sb => isCollide(sb, snakeBodies[0]));

    		if (snakeCollisions.length > 0) {
    			return true;
    		}

    		const { top, left } = snakeBodies[0];

    		if (top >= 700 || top < 0 || left < 0 || left >= 1000) {
    			return true;
    		}

    		return false;
    	}

    	function onKeyDown(e) {
    		const newDirection = getDirectionFromKeyCode(e.keyCode);

    		if (newDirection) {
    			$$invalidate(2, direction = newDirection);
    		}
    	}

    	setInterval(
    		() => {
    			snakeBodies.pop();
    			let { top, left } = snakeBodies[0];

    			if (direction === "up") {
    				top -= 50;
    			} else if (direction === "down") {
    				top += 50;
    			} else if (direction === "left") {
    				left -= 50;
    			} else if (direction === "right") {
    				left += 50;
    			}

    			const newHead = { left, top };
    			$$invalidate(3, snakeBodies = [newHead, ...snakeBodies]);

    			if (isCollide(newHead, { left: foodLeft, top: foodTop })) {
    				moveFood();
    				$$invalidate(3, snakeBodies = [...snakeBodies, snakeBodies[snakeBodies.length - 1]]);
    			}

    			if (isGameOver()) {
    				//alert("GAEME OVA");
    				resetGame();
    			}
    		},
    		200
    	);

    	function moveFood() {
    		$$invalidate(1, foodTop = Math.floor(Math.random() * 14) * 50);
    		$$invalidate(0, foodLeft = Math.floor(Math.random() * 20) * 50);
    	}

    	function resetGame() {
    		moveFood();
    		$$invalidate(2, direction = "right");
    		$$invalidate(3, snakeBodies = [{ left: 100, top: 0 }, { left: 50, top: 0 }, { left: 0, top: 0 }]);
    	}

    	resetGame();
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	$$self.$capture_state = () => ({
    		Snake,
    		Food,
    		SnakeBody,
    		foodLeft,
    		foodTop,
    		direction,
    		snakeBodies,
    		isCollide,
    		isGameOver,
    		getDirectionFromKeyCode,
    		onKeyDown,
    		moveFood,
    		resetGame,
    		score
    	});

    	$$self.$inject_state = $$props => {
    		if ("foodLeft" in $$props) $$invalidate(0, foodLeft = $$props.foodLeft);
    		if ("foodTop" in $$props) $$invalidate(1, foodTop = $$props.foodTop);
    		if ("direction" in $$props) $$invalidate(2, direction = $$props.direction);
    		if ("snakeBodies" in $$props) $$invalidate(3, snakeBodies = $$props.snakeBodies);
    		if ("score" in $$props) $$invalidate(4, score = $$props.score);
    	};

    	let score;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*snakeBodies*/ 8) {
    			 $$invalidate(4, score = snakeBodies.length - 3);
    		}
    	};

    	return [foodLeft, foodTop, direction, snakeBodies, score, onKeyDown];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    const app = new App({
      target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
