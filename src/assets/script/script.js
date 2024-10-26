document.addEventListener('DOMContentLoaded', function () {
	const banner = document.querySelector(".banner")
	const counts = banner.querySelectorAll(".banner__count img")
	const items = [...banner.querySelectorAll(".banner__items svg g g")]
	const backpack = banner.querySelector(".banner__backpack")
	const header = banner.querySelector(".banner__header")
	const ready = banner.querySelector(".banner__ready")
	const reset = banner.querySelector(".banner__reset")
	const easing = "cubic-bezier(0.4, 0, 0.65, 1.7)"

	function calcActive(active = 0) {
		counts.forEach((img, index) => {
			img.toggleAttribute("hidden", index != active)
		})
	}

	new ResizeObserver(entries => {
		banner.style.setProperty("--cqw", `${entries.at(0).contentRect.width / 100}px`)
	}).observe(banner)

	calcActive()

	items.forEach(item => {
		item.addEventListener("click", () => {
			item.toggleAttribute("data-checked")

			const active = items.reduce((accumulator, item) => {
				return accumulator += item.hasAttribute("data-checked")
			}, 0)

			if (active == items.length) {
				banner.dispatchEvent(new CustomEvent("allActive"))
			}

			calcActive(active)
		})
	})

	const backpackAnimationAppear = new Animation(new KeyframeEffect(backpack, [
		{
			transform: "scale(0.8)",
			opacity: 1
		}
	], {
		duration: 800,
		fill: "forwards",
		endDelay: 200,
		composite: "add",
		easing
	}))

	const backpackAnimationSlide = new Animation(new KeyframeEffect(backpack, [
		{
			transform: "translate(0, 43%)"
		}
	], {
		duration: 800,
		fill: "forwards",
		composite: "accumulate",
		easing: "ease"
	}))

	const itemsAnimations = items.map((item, index) => {
		const rect = item.getBBox()
		item.style.setProperty("transform-origin", `${rect.x + rect.width / 2}px ${rect.y + rect.height / 2}px`)

		const itemAnimation = new Animation(new KeyframeEffect(item, [
			{
				transform: "scale(0.8)",
				opacity: 0
			},
			{
				transform: "scale(1)",
				opacity: 1
			}
		], {
			duration: 220,

			fill: "both",
			delay: index * 90,
			easing
		}))

		return itemAnimation
	})

	const headerAnimation = new Animation(new KeyframeEffect(header, [
		{
			opacity: 1
		}
	], {
		duration: 800,
		fill: "both",
		easing: "ease"
	}))

	const readyAnimation = new Animation(new KeyframeEffect(ready, [
		{
			opacity: 1
		}
	], {
		duration: 400,
		fill: "both",
		easing: "ease"
	}))

	const resetAnimation = new Animation(new KeyframeEffect(reset, [
		{
			transform: "translateY(-36px)"
		}
	], {
		duration: 400,
		fill: "both",
		easing: "ease"
	}))

	const backpackAnimationSlideBack = new Animation(new KeyframeEffect(backpack, [
		{
			transform: "translate(0, -20%) scale(0.9125)",
			opacity: 1
		}
	], {
		duration: 400,
		iterations: 1,
		fill: "forwards",
		easing: "ease"
	}))

	function cancel() {
		backpackAnimationSlideBack.cancel()
		backpackAnimationSlide.cancel()
		backpackAnimationAppear.cancel()
		headerAnimation.cancel()
		resetAnimation.cancel()
		readyAnimation.cancel()
		itemsAnimations.forEach(animation => {
			animation.cancel()
			animation.effect.target.removeAttribute("data-checked")
			calcActive()
		})
	}

	backpackAnimationAppear.persist()
	backpackAnimationSlide.persist()
	backpackAnimationSlideBack.persist()

	backpackAnimationAppear.addEventListener("finish", () => {
		backpackAnimationSlide.play()
		itemsAnimations.forEach(animation => {
			animation.play()
		})
	})

	banner.addEventListener("allActive", () => {
		backpackAnimationSlideBack.play()
		readyAnimation.play()
		resetAnimation.play()
		itemsAnimations.forEach(animation => {
			animation.cancel()
		})
		headerAnimation.cancel()
	})

	document.querySelectorAll(".play, .banner__reset").forEach(btn => {
		btn.addEventListener("click", () => {
			cancel()
			backpackAnimationAppear.play()
			headerAnimation.play()
		})
	})

	document.querySelectorAll(".replay").forEach(btn => {
		btn.addEventListener("click", () => {
			cancel()
		})
	})
})
