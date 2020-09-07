/* 
 * RANGE.JS
 *
 * @version: 0.0.2
 * @author: niandco <https://github.com/niandco>
 * @license: MIT
 *
 */

 (function( win, doc ){

 	const _name = 'rangejs';
 	const _version = '0.0.2';

 	if( typeof win[_name] === 'function' ){
 		return;

 	}

 	function node( current ){

 		const func = {

 			isnode: function(){

 				return ( current && current.nodeType === Node.ELEMENT_NODE );

 			},

 			width: function(){

 				if( current === doc || current === win ){

 					return doc.documentElement.offsetWidth;


 				}else if( !func.isnode() ){
 					return 0;

 				}

 				return current.offsetWidth;

 			},

 			event: function( events, callback, data ){
 				const _current = current;
 				var a, ev;

 				if( typeof callback !== 'function' ){
 					return;

 				}

 				function listener( type ){

 					current.addEventListener( type, function( e ){
 						callback( e, this, data );

 					});

 				}

 				function event( type ){
 					var x;

 					if( current === doc || func.isnode() ){
 						listener( type );
 						return;

 					}

 					if( 'length' in current && current.length > 0 ){

 						for( x = 0; x < _current.length; x++ ){

 							current = _current[x];

 							if( !func.isnode() || current !== doc ){
 								current = _current;
 								continue;

 							}
 							listener( type );
 							current = _current;

 						}

 					}
 				}


 				if( typeof events !== 'string' || !Array.isArray( events = events.split( ' ' ) ) || events.length < 1 ){
 					return;

 				}

 				for( a in events ){

 					if( typeof ( ev = events[a] ) !== 'string' || ( ev = ev.trim() ).length < 1 ){
 						continue;

 					}
 					event( ev );

 				}

 			}

 		};

 		return func;

 	}

 	win[_name] = function( source, options ){
 		var dragging = false;
 		var x;

 		if( !source ){
 			return;

 		}

 		if( typeof options !== 'object' ){
 			options = {};

 		}

 		function getValues( from ){
 			var tmp, min, max;

 			if( !node( from ).isnode() ){
 				return {
 					min: 0,
 					max: 360,
 					step: 1,
 					value: 0
 				};

 			}

 			return {
 				min: ( min = sanitizeValue( from.getAttribute( 'min' ) ) ),
 				max: ( max = ( tmp = sanitizeValue( from.getAttribute( 'max' ) ) ) <= min ? min + 10 : tmp ),
 				step: ( tmp = sanitizeValue( from.getAttribute( 'step' ) ) ) <= 0 ? 0.1 : tmp,
 				value: ( tmp = sanitizeValue( from.value ) ) >= min && tmp <= max ? tmp : min

 			};

 		}

 		function sanitizeValue( value ){

 			if( typeof value !== 'number' && typeof value !== 'string' ){
 				return 0;

 			}

 			if( typeof ( value = parseFloat( value ) ) !== 'number' || isNaN( value ) ){
 				return 0;

 			}
 			return value;

 		}

 		function initDragger( dragger, value, min, max, step ){
 			var width, dwidth, r;

 			if( !node( dragger ).isnode() || !( width = node( dragger.parentNode ).width() ) ){
 				return false;

 			}
 			width = dragger.parentNode.scrollWidth;
 			dwidth = ( dwidth = sanitizeValue( node( dragger ).width() ) ) > 0 ? dwidth : 0;
 			width = width - dwidth;
 			r = parseInt( ( value / ( step * ( ( max - min ) / step ) + min ) ) * width );
 			dragger.style.left = r + 'px';
 			return r;

 		}

 		function style(){
 			var output = '.rangeJs{display:inline-block;height:10px;width:300px;position:relative;}';
 			output += '.rangeJs:before{position:absolute;height:3px;width:100%;top:50%;background:#9C9B94;left:0;margin-top:-1px;content:"";}';
 			output += '.rangeJs .dragger{position:absolute;top:0;left:0;width:10px;height:10px;background:#5C22FF;border-radius:10px;padding:0;margin:0;border:0;cursor:pointer;}';
 			output += '.rjsButton{padding:0;line-height:20px;border:0;background:#DEDCD3;border-radius:20px;width:20px;height:20px;text-align:center;margin-right:10px;cursor:pointer;font:500 15px/20px sans-serif;}';
 			output += '.rjsButton.increase{margin-right:0;margin-left:10px;}';
 			output += '.rjsButton:hover{background:#5C22FF;color:#DEDCD3;}';

 			return output;
 		}

 		function manageStyle(){
 			const cname = 'rangeJsDefaultStyle';
 			const css = doc.getElementsByClassName( cname );
 			var eStyle, x;

 			if( options.css && css.length < 1 ){
 				eStyle = doc.createElement( 'style' );
 				eStyle.className = cname;
 				eStyle.innerHTML = style();
 				doc.head.appendChild( eStyle );
 				return;
 			}

 			if( css.length > 1 ){

 				for( x = 0; x < css.length; x++ ){

 					if( x === 0 ){
 						continue;

 					}
 					css[x].parentNode.removeChild( css[x] );

 				}

 			}

 		}

 		function onDecInc( ev, ui, data, increase ){
 			ev.preventDefault();
 			var v, val;

 			if( typeof data !== 'object' || !node( data.source ).isnode() || !node( data.dragger ).isnode() ){
 				return false;

 			}
 			v = getValues( data.source );
 			val = Number( ( increase ? v.value + v.step : v.value - v.step ).toFixed( 2 ) );
 			val = val < v.min ? v.min : ( val > v.max ? v.max : val );
 			data.source.value = val;
 			data.value = val;

 			initDragger( data.dragger, val, v.min, v.max, v.step );

 			if( typeof options.change === 'function' ){
 				options.change( ev, ui, data );

 			}
 			return true;

 		}

 		function onrange( ev, ui, data ){
 			ev.preventDefault();
 			ev.stopPropagation();
 			var x, width, dwidth, val, delta, per, v;

 			if( ( ev.type !== 'mousemove' || !dragging ) && ev.type !== 'click' ){
 				return;

 			}

 			if( !( width = node( data.range ).width() ) || !( x = data.range.getBoundingClientRect().left ) ){
 				return;

 			}
 			v = getValues( data.source );
 			dwidth = ( dwidth = sanitizeValue( node( data.dragger ).width() ) ) > 0 ? dwidth : 0;

 			if( typeof ( delta = parseInt( ev.pageX - x ) ) !== 'number' || isNaN( delta ) ){
 				delta = 0;

 			}
 			delta = delta - ( dwidth / 2 );
 			width = width - dwidth;

 			if( delta > width ){
 				delta = width;

 			}

 			if( delta < 0 ){
 				delta = 0;

 			}
 			data.dragger.style.left = parseInt( delta ) + 'px';
 			per = ( ( delta ) / ( width || 1 ) );
 			val = v.step * Math.round( per * ( v.max - v.min ) / v.step ) + v.min;
 			val = Number( (val).toFixed(2) );
 			data.source.value = val;
 			data.value = val;

 			if( typeof options.change === 'function' ){
 				options.change( ev, ui, data );

 			}

 		}

 		function onstart( ev, ui, data ){
 			ev.preventDefault();

 			if( typeof data !== 'object' || !node( data.source ).isnode() || !node( data.range ).isnode() ){
 				return;

 			}

 			if( typeof options.start === 'function' ){
 				options.start( ev, ui, data );

 			}
 			data.value = sanitizeValue( data.source.value );
 			dragging = true;

 		}

 		function onstop( ev, ui ){
 			ev.preventDefault();

 			if( typeof options.stop === 'function' ){
 				options.stop( ev, ui );

 			}
 			dragging = false;

 		}

 		function onincrease( ev, ui, data ){
 			const _on = onDecInc( ev, ui, data, true );

 			if( !_on ){
 				return;

 			}

 			if( typeof options.increase === 'function' ){
 				options.increase( ev, ui, data );

 			}

 		}

 		function ondecrease( ev, ui, data ){
 			const _on = onDecInc( ev, ui, data, false );

 			if( !_on ){
 				return;

 			}

 			if( typeof options.decrease === 'function' ){
 				options.decrease( ev, ui, data );

 			}

 		}

 		function create( _ui ){
 			const wrap = _ui.parentNode;
 			const data = {};
 			var range, dragger, dec, inc, v;

 			if( !wrap || _ui.nodeName.toLowerCase() !== 'input' ){
 				return;

 			}
 			range = doc.createElement( 'div' );
 			range.className = 'rangeJs';

 			dragger = doc.createElement( 'button' );
 			dragger.className = 'dragger';
 			range.appendChild( dragger );

 			data.source = _ui;
 			data.range = range;
 			data.dragger = dragger;

 			if( options.buttons ){
 				dec = doc.createElement( 'button' );
 				dec.className = 'decrease rjsButton';
 				dec.innerHTML = '-';

 				inc = doc.createElement( 'button' );
 				inc.className = 'increase rjsButton';
 				inc.innerHTML = '+';

 				wrap.appendChild( dec );
 				wrap.appendChild( range );
 				wrap.appendChild( inc );
 				data.decrease = dec;
 				data.increase = inc;

 				node( dec ).event( 'click', ondecrease, data );
 				node( inc ).event( 'click', onincrease, data );

 			}else{
 				wrap.appendChild( range );

 			}
 			v = getValues( _ui );
 			initDragger( data.dragger, v.value, v.min, v.max, v.step );
 			node( dragger ).event( 'mousedown', onstart, data );
 			node( range ).event( 'click mousemove', onrange, data );

 		}

 		if( node( source ).isnode() ){

 			manageStyle();
 			create( source );

 		}else if( source !== doc && source !== win && typeof source === 'object' && source.length > 0 ){

 			manageStyle();

 			for( x in source ){

 				if( !node( source[x] ).isnode() ){
 					continue;

 				}
 				create( source[x] );
 			}

 		}else{
 			return;

 		}
 		node( doc.documentElement ).event( 'mouseup', onstop );

 	};

})( window, document );
