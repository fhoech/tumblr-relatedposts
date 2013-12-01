/*
 *   Copyright (c) 2013 Florian Höch - http://hoech.net/
 *   Based very loosely on tumblr-related-posts:
 *   http://code.google.com/p/tumblr-related-posts/
 *
 *   Changelog:
 *   Full refactored. Uses HTML 5 <article> and <header> elements.
 * 
 *   
 *   Copyright (c) 2012, Dominic Claxton - Dom Claxton - domclaxton -@domclaxton - http://domclaxton.tumblr.com - http://domclaxton.com
 *   Based on the Work by Eduardo Miranda - http://code.google.com/p/relposts/
 *
 *   Changelog:
 *   1.0 - Initial Release
 *   
 * 
 *   All rights reserved.
 *
 *   Tumblr Related Posts is free software: you can redistribute it and/or modify
 *   it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation, either version 3 of the License, or
 *   (at your option) any later version.
 *
 *   Tumblr Related Posts is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU General Public License for more details.
 *
 *   You should have received a copy of the GNU General Public License
 *   along with Tumblr Related Posts.  If not, see <http://www.gnu.org/licenses/>.
 *
*/

(function($) {

	console.info('Related posts: Initializing…');

	var defaults = {'domain': document.domain,
					'num': 8,  // Max. number of related posts to return
					'len': 60,  // Excerpt length
					'thumbwidth': 100,  // Preferred thumbnail width (height will scale accordingly)
					'tags': [],  // Post tags to search for
					'type': '',  // Limit posts to type. Empty string ('') for all types.
					'titlehtml': '<h3>Related Posts</h3>'};

	$.fn.relatedposts = function(options) {
		var $container = this,
			config = $.extend({}, defaults, options);
			related_posts = [];
		console.info('Related posts: Getting options…');
		for (option in config) {
			if (option in defaults && typeof defaults[option] == 'number')
				config[option] = parseInt(config[option]);
			switch (config[option].constructor) {
				case String:
					nice_representation = '“' + config[option] + '”';
					break;
				case Array:
					nice_representation = '[' + config[option].join(', ') + ']';
					break;
				default:
					nice_representation = config[option];
			}
			console.info('Related posts: Got' + (option in defaults ? '' : ' unrecognized') + ' option “' + option + '” = ' + nice_representation);
		};
		if (typeof config.tags == 'undefined') error('No tags defined.');
		else {
			$(config.tags).each(function (i, tag) {
				console.info('Related posts: Sending request for tag “' + tag + '”…');
				$.getJSON('http://api.tumblr.com/v2/blog/' + (config.domain || document.domain) + '/posts?api_key=L3SCmQDARjXqJFnzQhj2cS6yvIDJF8lxxZgJuwKvuTW7tAdDbm&limit=' + (config.num + 1) + '&offset=0&type=' + config.type + '&tag=' + escape(tag) + '&jsonp=?', function (data, textStatus, jqXHR) {
					console.info('Related posts: Got answer for tag “' + tag + '”…', data);
					if (related_posts.length == config.num) {
						console.info('Related posts: Skipping processing for tag “' + tag + '” because we already have hit the limit.');
					}
					else if (!data) error('No data.');
					else if (!data.response || !$.makeArray(data.response).length) {
						if (data.meta && data.meta.msg && data.meta.msg != 'OK') error(data.meta.msg);
						else error(data.response ? 'Empty response.' : 'No response object.');
					}
					else if (!data.response.posts) {
						if (data.meta && data.meta.msg && data.meta.msg != 'OK') error(data.meta.msg);
						else error('No posts object.');
					}
					else {
						console.info('Related posts: Processing ' + data.response.posts.length + ' posts for tag “' + tag + '”…');
						$(data.response.posts).each(function (i, post) {
							var title,
								body,
								title_regex = /<h\d>([^<]+)<\/h\d>/,
								title_match,
								image,
								note_count,
								alt_sizes = [];
							if (post.post_url != document.location.protocol + '//' + document.location.host + document.location.pathname + document.location.search && related_posts.length < config.num && !has_post(related_posts, post)) {
								console.info('Related posts: Processing post ID ' + post.id + ' “' + post.slug + '” (type ' + post.type + ') for tag “' + tag + '”…');
								/* Set title and body */
								switch (post.type) {
									case 'quote':
										title = post.quote;
										body = post.text;
										break;
									case 'photo':
									case 'video':
									case 'audio':
										body = post.caption;
										break;
									case 'answer':
										title = post.question;
										body = post.answer;
										break;
									default:
										title = post.title;
										body = post.body;
								}
								/* Check title */
								if (title == null && body) {
									title_match = body.match(title_regex);
									if (title_match) {
										title = title_match[1];
										body = body.replace(title_regex, '');
									}
								}
								/* Check body */
								if (title && body == null) {
									body = title;
									title = null;
								}
								/* Strip HTML tags from body */
								body = body.replace(/(<[^>]+>)/ig, '');
								/* Slice body to the desired length */
								if (body.length > config.len) {
									body = body.substr(0, config.len).replace(/[,;.:-_\s]+$/, '');
									body += '…';
								}
								/* Get Image */
								/* If article, try to get the first image out of the body */
								if (post.type == 'text') {
									image = $(post.body).find('img');
									if (image.length) image = {'url': image.attr('src'),
															   'width': image.attr('width'),
															   'height': image.attr('height')};
									else image = null;
								}
								/* If audio, get the album cover if available */
								else if (post.type == 'audio')
									image = {'url': this.album_art};
								else if (post.type == 'photo')
									/* Loop the photos, and make sure to select only the first in case of a slideshow */
									$(this.photos[0]).each(function () {
										/* Loop the various photo sizes to get the thumbnail information */
										$(this.alt_sizes).each(function (i, alt_size) {
											if (alt_size.width == config.thumbwidth) {
												image = alt_size;
												return false;
											}
											else alt_sizes.push(alt_size);
										});
										if (!image) {
											/* No thumbnail of the requested width found, find closest width */
											alt_sizes.sort(sort_by_width);
											$(alt_sizes).each(function (i, alt_size) {
												if (alt_size.width > config.thumbwidth) {
													image = alt_size;
													return false;
												}
											});
											/* Still no match, use smallest width */
											if (!image) image = alt_sizes[0];
										}
									});
								else if (post.type == 'video')
									image = {'url': this.thumbnail_url,
											 'width': this.thumbnail_width,
											 'height': this.thumbnail_height};
								
								/* Manage exceptions */
								if ((!image || image.url == 'undefined') && config.image) image = config.image;
								
								/* Set notes */
								note_count = post.note_count;
								if (note_count == 'undefined') note_count = 0;
								
								/* Add post snippet to container */
								console.info('Related posts: Appending post ID ' + post.id + ' “' + post.slug + '” for tag “' + tag + '”…');
								$container.append('<article class="' + post.type + '"><header>' + (image ? '<p class="related-post-image"><a href="' + post.post_url + '"><img src="' + image.url + '"' + (config.thumbwidth ? ' width="' + config.thumbwidth + '"' : '') + (image.width && image.height ? ' height="' + ((config.thumbwidth / image.width) * image.height) + '"' : '') + ' alt=""></a></p>' : '') + (title ? '<h3><a href="' + post.post_url + '">' + title + '</a></h3>' : '') + '</header><p><a href="' + post.post_url + '">' + body + '</a></p></article>');
								related_posts.push(post.id);
							}
							else console.info('Related posts: Skipping processing for post ID ' + post.id + ' “' + post.slug + '” for tag “' + tag + '”');
						});
						console.info('Related posts: Processing for tag “' + tag + '” complete.');
						if (related_posts.length && $container.parent().html().toLowerCase().indexOf(config.titlehtml.toLowerCase()) < 0)
							$container.before(config.titlehtml);
						if (related_posts.length == config.num) {
							console.info('Related posts: Triggering relatedposts.load…');
							$(window).trigger('relatedposts.load', related_posts);
						}
					}
				}).fail(function () {
					error('Request failed.');
				});
			})
		};

		function error(msg) {
			console.error('Related posts error: ' + msg);
			$container.html('<p>Error: ' + msg + '</p>');
		};
	};

	function has_post(posts, post) {
		return $.grep(posts, function (post_id) {
			return post_id == post.id;
		}).length > 0;
	};
	
	function sort_by_width(a, b) {
		if (a.width < b.width) return -1;
		else if (a.width > b.width) return 1;
		return 0;
	};

})(jQuery);