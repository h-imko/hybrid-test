document.addEventListener('DOMContentLoaded', function () {
	const counts = document.querySelectorAll(".banner__count img")
	const items = [...document.querySelectorAll(".banner__items svg g g")]
	const backpack = document.querySelector(".banner__backpack")
	const header = document.querySelector(".banner__header")
	const easing = "cubic-bezier(0.4, 0, 0.65, 2)"

	counts.forEach((img, index) => {
		img.toggleAttribute("hidden", index != 0)
	})

	items.forEach(item => {
		item.addEventListener("click", () => {
			item.toggleAttribute("data-checked")

			const active = items.reduce((accumulator, item) => {
				return accumulator += item.hasAttribute("data-checked")
			}, 0)

			counts.forEach((img, index) => {
				img.toggleAttribute("hidden", index != active)
			})
		})
	})

	const backpackAnimationAppear = new Animation(new KeyframeEffect(backpack, [
		{
			transform: "translateY(-170px) translateX(-6px) rotate(-11deg)",
			opacity: 0
		}, {
			transform: "translateY(-170px) translateX(-6px) scale(0.8) rotate(-11deg)",
			opacity: 1
		}
	], {
		duration: 800,
		iterations: 1,
		fill: "both",
		endDelay: 200,
		easing
	}))

	const backpackAnimationSlide = new Animation(new KeyframeEffect(backpack, [
		{
			transform: "scale(0.8) translateX(-6px) rotate(-11deg)",
		}
	], {
		duration: 800,
		iterations: 1,
		fill: "both",
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
			iterations: 1,
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
		iterations: 1,
		fill: "both",
	}))

	backpackAnimationAppear.addEventListener("finish", () => {
		backpackAnimationSlide.play()
		itemsAnimations.forEach(animation => {
			animation.play()
		})
	})

	document.querySelector(".play").addEventListener("click", () => {
		backpackAnimationAppear.cancel()
		backpackAnimationSlide.cancel()
		headerAnimation.cancel()
		itemsAnimations.forEach(animation => {
			animation.cancel()
		})
		backpackAnimationAppear.play()
		headerAnimation.play()
	})
})
