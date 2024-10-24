import fs from "fs"
import gulp from "gulp"
import sourcemaps from "gulp-sourcemaps"
import { stacksvg } from "gulp-stacksvg"
import { nothing, printPaintedMessage } from "./gulp/service.mjs"
import { reload, replaceSrc, clean, newer, ext, ejsCompile, removeExcess, replace, iconsToCSS, ttfToWoff, sharpWebp, getDestPath } from "./gulp/custom.mjs"
import { bs, argv, convertingImgTypes, gulpMem, destGulp } from "./gulp/env.mjs"
import { createGulpEsbuild } from "gulp-esbuild"
import { sassPlugin } from "esbuild-sass-plugin"
import postcss from "postcss"
import autoprefixer from "autoprefixer"

const esbuild = createGulpEsbuild({
	piping: true,
	incremental: argv.fwatch,
})

const SASSEsbuild = createGulpEsbuild({
	piping: true,
	incremental: argv.fwatch,
})

function cleanExtraImgs() {
	return gulp.src([`./src/assets/static/img/**/*`, `!./src/assets/static/img/icon/stack.svg`], {
		allowEmpty: true,
		read: false,
		nodir: true
	})
		.pipe(removeExcess('img-raw', 'img', ...convertingImgTypes))
		.on("error", function (error) {
			printPaintedMessage(error.message, "Files")
			bs.notify("Files Error")
			this.emit("end")
		})
}

function browserSyncInit() {
	bs.init({
		server: {
			baseDir: "./build",
			middleware: argv.ram ? gulpMem.middleware : false,
		},
		port: argv.port ?? 80
	})
}

function css() {
	return gulp.src(["./src/assets/style/**/*.scss", "!./src/assets/style/**/_*.scss"])
		.pipe(sourcemaps.init())
		.pipe(SASSEsbuild({
			sourcemap: "linked",
			outbase: "/src",
			outdir: "/build",
			minify: true,
			plugins: [sassPlugin({
				embedded: true,
				style: "compressed",
				precompile(source) {
					return source.replaceAll("/src/", "/")
				},
				async transform(source, resolveDir, filePath) {
					const { css } = await postcss([autoprefixer]).process(source, {
						from: filePath
					})

					return css
				}
			})]
		}))
		.on("error", function (error) {
			printPaintedMessage(error.message, "CSS")
			bs.notify("CSS Error")
			this.emit("end")
		})
		.pipe(sourcemaps.write("./"))
		.pipe(destGulp.dest(getDestPath))
		.pipe(bs.stream())
}

function js() {
	return gulp.src(["./src/assets/script/**/*.js", "!./src/assets/script/**/_*.js"])
		.pipe(sourcemaps.init())
		.pipe(esbuild({
			outbase: "/src",
			outdir: "/build",
			sourcemap: "linked",
		}))
		.on("error", function (error) {
			printPaintedMessage(error.message, "JS")
			bs.notify("JS Error")
			this.emit("end")
		})
		.pipe(sourcemaps.write("./"))
		.pipe(destGulp.dest(getDestPath))
		.pipe(bs.stream())
}

function html() {
	return gulp.src(["./src/*.ejs", "./src/*.html"])
		.pipe(ejsCompile())
		.on("error", function (error) {
			printPaintedMessage(`${error.message}`, "EJS")
			bs.notify("EJS Error")
			this.emit("end")
		})
		.pipe(ext(".html"))
		.pipe(replace(".scss", `.css?timestamp=${new Date().getTime()}`))
		.pipe(replace(".ejs", ".html"))
		.pipe(replace(".js", `.js?timestamp=${new Date().getTime()}`))
		.pipe(replaceSrc())
		.pipe(destGulp.dest(getDestPath))
		.pipe(bs.stream())
}

function copyStatic() {
	return gulp.src(["./src/assets/static/**/*", "!./src/assets/static/img-raw/**/*"], {
		allowEmpty: true,
		since: gulp.lastRun(copyStatic),
		nodir: true,
		encoding: false
	})
		.pipe(destGulp.dest(getDestPath))
		.pipe(reload())
}

function makeIconsSCSS() {
	return gulp.src("./src/assets/static/img-raw/icon/**/*.svg", {
		allowEmpty: true,
		read: false
	})
		.pipe(iconsToCSS())
		.pipe(fs.createWriteStream("./src/assets/style/_icons.scss"))
}

function makeIconsStack() {
	return gulp.src(`./src/assets/static/img-raw/icon/**/*.svg`)
		.pipe(stacksvg({
			separator: "__"
		}))
		.pipe(gulp.dest(`./src/assets/static/img/icon/`))
}

function imageMin() {
	return gulp.src("./src/assets/static/img-raw/**/*", {
		allowEmpty: true,
		nodir: true,
		encoding: false
	})
		.pipe(newer("./src/assets/static/img/", ".webp", ...convertingImgTypes))
		.pipe(sharpWebp())
		.pipe(ext(".webp", ...convertingImgTypes))
		.pipe(gulp.dest("./src/assets/static/img/"))
}

function cleanBuild() {
	return gulp.src("./build/", {
		read: false,
		allowEmpty: true
	})
		.pipe(clean())
}

function convertFont() {
	return gulp.src("./src/assets/static/font/**/*.ttf", {
		encoding: false
	})
		.pipe(ttfToWoff())
		.pipe(clean())
		.pipe(ext(".woff2"))
		.pipe(gulp.dest("./src/assets/static/font/"))
}

function cleanInitials() {
	return gulp.src("./src/**/.gitkeep", {
		allowEmpty: true,
		read: false
	})
		.pipe(clean())
}

function watch() {
	gulp.watch(["./src/**/*.html", "./src/**/*.ejs"], html)
	gulp.watch(["./src/assets/script/**/*"], js)
	gulp.watch(["./src/assets/style/**/*"], css)
	gulp.watch(["./src/assets/static/img-raw/icon/**/*.svg"], gulp.parallel(makeIconsStack, makeIconsSCSS))
	gulp.watch(["./src/assets/static/img-raw/"], gulp.parallel(imageMin, cleanExtraImgs))
	gulp.watch(["./src/assets/static/**/*", "!./src/assets/static/img-raw/**/*"], copyStatic)
}

export default gulp.series(
	gulp.parallel(
		argv.ram ? nothing : cleanBuild,
		imageMin,
		cleanExtraImgs,
		makeIconsSCSS,
		makeIconsStack
	), gulp.parallel(
		copyStatic,
		css,
		js,
		html
	), argv.fwatch ? gulp.parallel(
		watch,
		browserSyncInit
	) : nothing
)

export { imageMin, convertFont as ttfToWoff, cleanInitials }