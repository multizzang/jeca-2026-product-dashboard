(() => {
  const latestBooths = {
    "company-004":"3-65","company-005":"1-15","company-016":"1-54","company-017":"3-04","company-020":"1-55","company-021":"3-41","company-024":"1-19","company-025":"1-93","company-026":"2-42","company-027":"3-10","company-028":"3-47","company-061":"1-98","company-062":"2-64","company-063":"3-06","company-064":"1-62","company-066":"1-47","company-067":"2-50","company-068":"3-09","company-070":"1-39","company-072":"3-03","company-073":"2-21","company-075":"1-90","company-076":"3-19","company-078":"2-04","company-079":"1-24","company-080":"3-57","company-081":"3-73","company-082":"2-35","company-084":"3-80","company-085":"3-22","company-086":"3-43","company-087":"2-38","company-088":"2-30","company-089":"2-56","company-091":"3-70","company-095":"3-51","company-097":"2-51","company-099":"2-26","company-100":"3-83","company-102":"2-70","company-104":"1-70","company-105":"3-87","company-106":"1-86","company-107":"3-32","company-111":"1-46","company-114":"2-08","company-117":"3-66","company-119":"3-59","company-123":"1-04","company-125":"2-32","company-126":"2-15","company-127":"2-05","company-128":"2-40","company-129":"1-30","company-137":"1-92","company-138":"3-28","company-141":"1-69","company-142":"3-84","company-145":"2-65","company-146":"1-28","company-147":"1-88","company-181":"1-87","company-183":"1-94","company-185":"2-53","company-190":"3-77","company-194":"1-102","company-195":"3-64","company-196":"1-03","company-197":"1-60","company-198":"3-11","company-200":"2-09","company-202":"1-81","company-203":"1-59","company-204":"1-82","company-205":"3-49","company-206":"2-33","company-207":"1-95","company-211":"3-45","company-214":"1-63","company-218":"1-65","company-219":"1-72","company-223":"1-56","company-224":"3-31","company-228":"1-43","company-229":"1-91","company-232":"2-46","company-234":"1-11","company-235":"3-81","company-236":"2-39","company-238":"1-22","company-249":"2-02","company-250":"1-12","company-251":"2-54","company-252":"3-60","company-253":"1-14","company-254":"2-01","company-255":"2-12","company-256":"3-61","company-257":"1-103","company-258":"3-44","company-259":"3-69","company-261":"3-29","company-262":"2-11","company-263":"3-62","company-264":"2-03","company-265":"2-13","company-266":"3-30","company-267":"3-48"
  };
  const onlineOnlyBooths = { "company-014":"1-01" };
  const products = (window.JECA_DATA && window.JECA_DATA.products) || [];
  products.forEach((product) => {
    const booth = latestBooths[product.id];
    if (booth) {
      product.booth = booth;
      product.online_booth = booth;
    }
    if (onlineOnlyBooths[product.id]) product.online_booth = onlineOnlyBooths[product.id];
  });
  const core = document.createElement("script");
  core.src = "./assets/main_core.js";
  document.head.appendChild(core);
})();
