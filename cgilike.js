rmFS = require("./rmFS.js")
helpObj = require("./help.js")
JSZip = require("jszip")
fs = require("fs")
afs = fs.promises
path = require("path")
markdownit = require("markdown-it")
mimes = require("mime-types")
void({default:fetch} = require("node-fetch"))
void({JSDOM} = require("jsdom"))

function thinginator() {
	var prevCh, ch = null
	var stdin = fs.openSync("/dev/stdin","rs")
	var buf = Buffer.alloc(1)
	var s = []
	var nls = 0
	var hdrs = [[],[],{},null]
	while (fs.readSync(stdin,buf)>=1) {
		prevCh = ch
		var ch = buf[0]
		nls = (ch===10)?(nls+1):0
		var sIdx = s.length-1
		if ((nls===2)||(prevCh===null)) {
			if (sIdx<2) {
				s.push([])
				if (prevCh===null) s[s.length-1].push(ch)
				if (sIdx>=0) s[sIdx].splice(s[sIdx].length-1)
				continue
			}
		}
		if ((ch===10)&&(prevCh===10)) continue
		one: switch (sIdx) { // grad uses labels in javascript??? no way!
			case 1:
				switch (ch) {
					case 10:
						if (hdrs[0].length>0) hdrs[2][String.prototype.toLowerCase.call(Buffer.from(hdrs[0]))]=Buffer.from(hdrs[1])+"" // .replace(new RegExp("-[a-z]","g"),function(a){return(a[1]).toUpperCase()})
						hdrs.splice(0,2,[],[]) // now ik how switch case fallthrough works… hopefully…
						hdrs[3]=null
					case 61:
						break one
					default: break
				}
				var v = (((hdrs[1].length>0)||(hdrs[3]!==null))||(prevCh===61))
				if (v) {
					if (hdrs[3]===null) {
						hdrs[3] = ch
						break one
					}
					hdrs[1].push(parseInt(Buffer.from([hdrs[3],ch])+"",16))
					hdrs[3]=null
					break one
				}
				hdrs[0].push(ch)
			default: break
		}
		s[s.length-1].push(ch)
	}
	var main = String.prototype.split.call(Buffer.from(s[0])," ")
	var [u,q] = main[1].split(new RegExp("(?<=^[^?]*)\\?","g"))
	var code = 200
	var rHdrs = [["content-type","text/html; charset=utf8"]]
	var unflushed = null
	function flushPrev(s) {
		if (unflushed===null) {
			unflushed = ""
			console.log(code)
			console.log(Object.entries(Object.fromEntries(rHdrs)).map(function(a){return(a).join(": ")}).concat([""]).join("\n"))
		}
		unflushed = Buffer.from(unflushed)
		if (done) unflushed = Buffer.concat([unflushed,Buffer.from(s+"")])
		process.stdout.write(unflushed)
		unflushed = done?"":s
	}
	var relative2 = __dirname
	function resolve(p) {return path.resolve(relative2,p)}
	// Source - https://stackoverflow.com/a/27267762
	// Posted by Leo, modified by community. See post 'Timeline' for change history
	// Retrieved 2026-11-22, License - CC BY-SA 4.0
	function flatten(ary) {
		return ary.reduce(function(a, b) {
			if (Array.isArray(b)) {
				return a.concat(flatten(b))
			}
			return a.concat(b)
		}, [])
	}
	function matchAll(s,r) {
		function inn() {
			try {
				return s.matchAll(r)
			} catch (_) {return [s.match(r)]}
		}
		return flatten(inn())
	}
	function files(d,from=__dirname) {
		return flatten(fs.readdirSync(path.resolve(from,d),{recursive:true,withFileTypes:true}).filter(function(a){return(a).isFile()}).map(function({name,parentPath}){return"/"+path.relative(path.resolve(from,d),path.join(parentPath,name))}))
	}
	var done = false
	var visible = {
		m: main[0],
		u,
		q: new URLSearchParams(q),
		b: Buffer.from(s[2]),
		c() {
			if (unflushed===null) Array.prototype.forEach.call(arguments,function(c){code=c})
			return code
		},
		h() {
			var a = Array.from(arguments)
			switch (a.length) {
				case 0: return Object.fromEntries(rHdrs)
				case 1:
					return hdrs[2][String.prototype.toLowerCase.call(a[0])]
				default:
					if (a[1]+"") rHdrs.push([String.prototype.toLowerCase.call(a[0]),a[1]+""])
					break
			}
		},
		w(s) {
			if ((!(s))&&(s!=="")) s=""
			flushPrev(s)
		},
		s(f) {
			visible.h("Content-Type", mimes.contentType(path.posix.extname(f))||"")
			visible.w(fs.readFileSync(resolve(f)))
		},
		r(f,ctx) {
			visible.w(require("ejs").renderFile(resolve(f+".ejs"),ctx))
		},
		rf(f) {return resolve(f)}
	}
	return {
		done() {
			flushPrev("")
			done = true
		},
		async run(stat, info) {
			function chkU(w,u) {
				var res = w.some(function(a){return(a===u)})
				if ((path.posix.extname(u)==="")&&(!(res))) return chkU(w,u+((u.endsWith("/")?"":"/")+"index.html"))
				return res
			}
			for (var [w,p] of stat) {
				if (chkU(files(w,__dirname),u)) {
					if (path.posix.extname(u)==="") u+=(u.endsWith("/")?"":"/")+"index.html"
					visible.c(200)
					relative2 = path.resolve(__dirname,w)
					visible.s(u.slice(1))
					return
				}
			}
			for (var [r,w] of info) {
				var ma = [r]
				var reg = Object.prototype.toString.call(r)==="[object RegExp]"
				if (reg) ma = matchAll(u,r)
				if (chkU(ma,u)) {
					relative2 = __dirname
					var call = w
					if (typeof w !== "function") {
						w = path.resolve(__dirname,w+"")
						relative2 = path.dirname(w)
						call = require(w)
					}
					if (!(reg)) ma=[]
					await call(visible,...ma)
					break
				}
			}
		}
	}
}

async function dir2Zip(a) {
	var zip = new JSZip()
	async function work(a, b) {
		var c = await afs.readdir(a)
		for (var d of c) {
			var e = require("path").join(a, d)
			var f = await afs.stat(e)
			if (f.isDirectory()) {
				var subfolder = b.folder(d)
				await work(e, subfolder)
			} else {
				b.file(d, await afs.readFile(e))
			}
		}
	}
	await work(a, zip)
	return zip
}

async function getMTimeFor(a) {
	async function work(a, b) {
		var c = await afs.readdir(a)
		for (var d of c) {
			var e = require("path").join(a, d)
			var f = await afs.stat(e)
			if (f.isDirectory()) {
				b = await work(e, b)
			} else {
				b = b < f.mtime ? f.mtime : b
			}
		}
		return b
	}
	return await work(a, new Date(0))
}

!async function() {
	var a = thinginator()
	/*
		a.visible.h("Content-Type", "text/plain") // .h(any, any) and .c(number) are interchangeable!
		a.visible.c(418)
		a.visible.w() // point of no return
		a.visible.w(`hello, ${a.visible.h("User-agent")}!\n`)
		a.visible.w(JSON.stringify(a.visible.q))
	*/
	await a.run([["static","/"]], [
		["/gpworks.zip", async function(c) {
			var d = c.rf("gpworks")
			c.h("content-type", "application/zip")
			var zip = await dir2Zip(d)
			zip.file("mtime.txt", (await getMTimeFor(d)).toUTCString())
			c.w(await zip.generateAsync({type: "nodebuffer"}))
		}],
		[new RegExp("^/(gp\\.js|FileSaver\\.js|emModule.js|gp_wasm\\.wasm)$"), async function(c) {
			var mainGP = c.u==="/gp.js"
			var f = await fetch("https://gpblocks.org/run/"+(mainGP?`gp_${c.q.has("wasm")?"wasm":"js"}.js`:c.u.slice(1)))
			c.c(f.status)
			c.h("content-type", f.headers.get("content-type"))
			c.w((mainGP?rmFS:function(a){return(a)})(await f.arrayBuffer()))
		}],
		["/README.html", async function(c) {
			c.h("content-type", mimes.contentType("html"))
			var html = markdownit({html: true}).render(await afs.readFile("README.md", "utf8"))
			var title = new JSDOM(html).window.document.querySelector("body > h1:first-of-type").textContent
			c.r("temp", {html, title})
		}],
		// ***********************************************
		// THIS IS THE 404, DO NOT PUT ANYTHING PAST THIS!
		// ***********************************************
		[new RegExp("^.*$"),function(c) {
			c.c(404)
			c.w("<!DOCTYPE html><html><head><meta http-equiv=\"Refresh\" content=\"0;/\"></head><body><p><a href=\"/\">impatient</a> much?</p></body></html>")
		}]
	])
	a.done()
}()
