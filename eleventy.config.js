module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ public: "/" });

  eleventyConfig.addCollection("articles", function (collectionApi) {
    return collectionApi.getFilteredByTag("articles").sort((a, b) => {
      return b.date - a.date;
    });
  });

  eleventyConfig.addFilter("dateReadable", function (dateObj) {
    return new Date(dateObj).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  });

  eleventyConfig.addFilter("byGenre", function (articles, genre) {
    return articles.filter((article) => article.data.genre === genre);
  });

  eleventyConfig.addFilter("slugify", function (str) {
    return String(str)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site"
    }
  };
};
