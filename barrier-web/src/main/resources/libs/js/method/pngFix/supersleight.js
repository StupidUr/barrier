var pngPrePath = "../../libs/";
if ($("#skin").attr("prePath") != null) {
	pngPrePath = $("#skin").attr("prePath")
}
var supersleight = function() {
		var d = false;
		var b = true;
		var h = pngPrePath + "libs/js/method/pngFix/x.gif";
		var a = /x\.gif$/i;
		var g = function() {
				if (d) {
					d = document.getElementById(d)
				} else {
					d = document
				}
				for (var j = d.all.length - 1, k = null;
				(k = d.all[j]); j--) {
					if (k.currentStyle.backgroundImage.match(/\.png/i) !== null) {
						if($(k).context.nodeName == "INPUT"){
							return;
						}
						f(k)
					}
					if (k.tagName == "IMG" && k.src.match(/\.png$/i) !== null) {
						c(k)
					}
					if (b && (k.tagName == "A" || k.tagName == "INPUT") && k.style.position === "") {
						k.style.position = "relative"
					}
				}
			};
		var f = function(j) {
				var l = "scale";
				var i = j.currentStyle.backgroundImage;
				var k = i.substring(5, i.length - 2);
				if (j.currentStyle.backgroundRepeat == "no-repeat") {
					l = "crop"
				}
				j.style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" + k + "', sizingMethod='" + l + "')";
				j.style.backgroundImage = "url(" + h + ")"
			};
		var c = function(i) {
				var j = i.src;
				i.style.width = i.width + "px";
				i.style.height = i.height + "px";
				i.style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" + j + "', sizingMethod='scale')";
				i.src = h
			};
		var e = function(i) {
				var j = window.onload;
				if (typeof window.onload != "function") {
					window.onload = i
				} else {
					window.onload = function() {
						if (j) {
							j()
						}
						i()
					}
				}
			};
		return {
			init: function() {
				e(g)
			},
			limitTo: function(i) {
				d = i
			},
			run: function() {
				g()
			}
		}
	}();
if (window.navigator.userAgent.indexOf("MSIE") >= 1) {
	supersleight.init()
};