rmFS = require("./rmFS.js")
helpObj = require("./help.js")
request = require("request")
express = require("express")
JSZip = require("jszip")
fs = require("fs")
afs = fs.promises
markdownit = require("markdown-it")
void({JSDOM} = require("jsdom"))

app = express()

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

app.use(express.static(`${__dirname}/static`))
app.use("/examples/", express.static(`${__dirname}/gpworks/Examples`))

app.set("view engine", "ejs")
app.set("views", ".")

app.get("/emModule.js", async function(req, res) {
	var resp = (await (require("util").promisify(request))("https://gpblocks.org/run/emModule.js", {encoding: null}))
	res.header("content-type", resp.headers["content-type"])
	res.send(resp.body)
})

app.get("/FileSaver.js", async function(req, res) {
	var resp = (await (require("util").promisify(request))("https://gpblocks.org/run/FileSaver.js", {encoding: null}))
	res.header("content-type", resp.headers["content-type"])
	res.send(resp.body)
})

app.get("/gp.js", async function(req, res) {
	var url = `https://gpblocks.org/run/gp_${"wasm" in req.query ? "wasm" : "js"}.js`
	console.log(url)
	var resp = (await (require("util").promisify(request))(url, {encoding: "utf8"}))
	res.header("content-type", resp.headers["content-type"])
	res.send(rmFS(resp.body))
})

app.get("/gp_wasm.wasm", async function(req, res) {
	var resp = (await (require("util").promisify(request))("https://gpblocks.org/run/gp_wasm.wasm", {encoding: null}))
	res.header("content-type", resp.headers["content-type"])
	res.send(resp.body)
})

app.get("/gpworks.zip", async function(req, res) {
	res.header("content-type", "application/zip")
	var zip = await dir2Zip("gpworks")
	zip.file("mtime.txt", (await getMTimeFor("gpworks/runtime/lib")).toUTCString())
	res.send(await zip.generateAsync({type: "nodebuffer"}))
})

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

app.get("/README.html", async function(req, res) {
	res.header("content-type", "text/html")
	var html = markdownit({html: true}).render(await afs.readFile("README.md", "utf8"))
	var title = new JSDOM(html).window.document.querySelector("body > h1:first-of-type").textContent
	res.render("temp", {html, title})
})

/*
	app.get("/mtime/", async function(req, res) {
		res.header("content-type", "text/plain")
		res.send((await getMTimeFor("gpworks/runtime/lib")).toUTCString())
	})
*/

app.get("/help.json", function(req, res) {
	res.header("content-type", "application/json")
	res.send({msg: "idfk"})
})

app.listen(8080)