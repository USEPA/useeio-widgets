import { isNode, isBool, isFunction, isObject, isString } from '../../utils/is.js';
import node from '../../dom/element.js';

/* global document, window */

/**
 *
 *	@TODO	Rewrite core object out of the main function
 *
 */

const DOCUMENT = document;

const CORE = {};

export default function( source, options ){

	const _d = document;

	const __range = {
		node: null,
		isDragging: false,
		dragger: {
			node: null
		},
		values: {
			min: 0,
			max: 1,
			step: 0.1,
			unit: '',
			value: 0
		}

	};

	const __core = {

		parse: {

			number: function( entry ){

				return typeof ( entry = parseFloat( entry ) ) === 'number' && !isNaN( entry ) ? Number( entry.toFixed( 2 ) ) : 0;

			},

			value: function(){

				return __core.parse.number( source.value );

			},

			max: function(){

				return __core.parse.number( source.getAttribute( 'max' ) );

			},

			min: function(){

				return __core.parse.number( source.getAttribute( 'min' ) );

			},

			step: function(){

				return __core.parse.number( source.getAttribute( 'step' ) );

			}

		},

		get: {

			positionFromValue: function(){
				const v = __range.values;

				return __core.parse.number( ( ( v.value - v.min ) / ( v.step * ( v.max - v.min ) / v.step ) ) * 100 );

			},

			valueFromPosition: function(){
				const dWidth = __range.dragger.node.offsetWidth;
				const rWidth = __range.node.scrollWidth - dWidth;
				const v = __range.values;

				return __core.parse.number( v.step * Math.round( ( v.position / 100 ) * ( v.max - v.min ) / v.step ) + v.min );

			}


		},

		set: {

			value: function( value ){
				value = __core.parse.number( value );
				value = value <= __range.values.min ? __range.values.min : ( value >= __range.values.max ? __range.values.max : value );

				__range.values.value = value;
				source.value = value;

			},

			values: function(){
				var max = __core.parse.max();
				var min = ( ( min = __core.parse.min() ) >= max ? min-- : min );
				var step = ( step = __core.parse.step() ) <= 0 ? ( ( max - min ) / 2 ) : step;

				__range.values.min = min;
				__range.values.max = max;
				__range.values.step = step;
				__range.values.unit = isObject( source.dataset ) ? ( isString( source.dataset.unit ) ? source.dataset.unit : '' ) : '';

				__core.set.value( __core.parse.value() );
				__core.set.position( __core.get.positionFromValue() );

			},

			position: function( position ){
				position = __core.parse.number( position );
				position = position >= 0 || position <= 100 ? position : ( position > 100  ? 100 : 0 );
				__range.values.position = position;

			},

			dragger: function(){
				const position = __range.values.position;
				const value = __range.values.value;
				const unit = __range.values.unit;

				__range.dragger.node.innerHTML = '<span class="comet-range__bar__dragger__value">' + value + unit + '</span>';
				__range.dragger.node.style.left = position + '%';
				//__range.dragger.node.style.left = 'calc( ' + position + '% - ' + ( __range.dragger.node.offsetWidth / 2 )  + 'px )';

			},

			flexValue: function( ev, ui, increase ){
				let value = __range.values.value;
				const step = __range.values.step;

				increase = isBool( increase ) && increase ? true : false;
				value = increase ? value + step : value - step;

				__core.set.value( value );
				__core.set.position( __core.get.positionFromValue() );
				__core.set.dragger();

				if( isFunction( options.change ) ){
					options.change( ev, ui, __range.values.value );

				}

			}

		},

		actions: {

			range: function( ev, ui ){

				var _x, rWidth, dWidth, delta;

				ev.preventDefault();
				ev.stopPropagation();

				if( ( ev.type !== 'mousemove' || !__range.isDragging ) && ev.type !== 'click' ){
					return;

				}
				_x = __range.node.getBoundingClientRect().left;
				dWidth = __range.dragger.node.offsetWidth;
				rWidth = __range.node.scrollWidth - dWidth;

				delta = __core.parse.number( ev.pageX - _x );
				delta = isNaN( delta ) ? 0 : delta;
				delta = delta - ( dWidth / 2 );
				delta = delta > rWidth ? rWidth : ( delta < 0 ? 0 : delta );

				__core.set.position( (delta / rWidth) * 100 );
				__core.set.value( __core.get.valueFromPosition() );
				__core.set.dragger();

				if( isFunction( options.change ) ){
					options.change( ev, ui, __range.values.value );

				}

			},

			start: function( ev, ui ){
				ev.preventDefault();

				if( isFunction( options.start ) ){
					options.start( ev, ui, __range.values.value );

				}
				__range.isDragging = true;

			},

			stop: function( ev, ui ){
				ev.preventDefault();

				if( isFunction( options.stop ) ){
					options.stop( ev, ui, __range.values.value );

				}
				__range.isDragging = false;

			},

			decrease: function( ev, ui ){

				__core.set.flexValue( ev, ui, false );

				if( isFunction( options.decrease ) ){
					options.decrease( ev, ui, __range.values.value );

				}

			},

			increase: function( ev, ui ){

				__core.set.flexValue( ev, ui, true );

				if( isFunction( options.increase ) ){
					options.increase( ev, ui, __range.values.value );

				}


			},

			destroy: function(){

				__range.node.parentNode.parentNode.removeChild( __range.node.parentNode );

			},

			create: function(){
				const fragment = _d.createElement( 'div' );
				var inner = '';
				var range = null;
				var dec = null;
				var inc = null;
				var children = null;

				fragment.className = 'comet-range';

				if( options.buttons ){
					inner += '<button class="comet-range__decrease comet-button">-</button>';

				}
				inner += '<div class="comet-range__bar"><button class="comet-range__bar__dragger"></button></div>';


				if( options.buttons ){
					inner += '<button class="comet-range__increase comet-button">+</button>';

				}
				fragment.innerHTML = inner;

				if( options.buttons ){
					children = fragment.children;
					dec = children[0];
					range = children[1];
					inc = children[2];

					node( dec ).on( 'click', __core.actions.decrease );
					node( inc ).on( 'click', __core.actions.increase );

				}else{
					range = fragment.firstChild;

				}
				source.parentNode.appendChild( fragment );

				__range.node = range;
				__range.dragger = {
					node: range.firstChild,
					width: range.firstChild.offsetWidth

				};
				__core.set.values();
				__core.set.dragger();

				node( range ).on( 'click mousemove', __core.actions.range );
				node( range.firstChild ).on( 'mousedown', __core.actions.start );
				node( _d.documentElement ).on( 'mouseup', __core.actions.stop );

			}
		}

	};

	if( !isNode( source ) || source.parentNode === null || source.nodeName !== 'INPUT' ){
		return;

	}

	if( typeof options !== 'object' ){
		options = {};

	}
	__core.actions.create();

	return {
		range: {
			target: __range.node,
			width: __range.node.scrollWidth,
			height: __range.node.scrollHeight
		},
		dragger: {
			target: __range.dragger.node,
			width: __range.dragger.node.offsetWidth,
			height: __range.dragger.node.offsetHeight
		},
		destroy: __core.actions.destroy
	};

}