tumblr-relatedposts
===================

Show related posts on tumblr permalink pages.  
Prerequisites: jQuery.

Usage
-----

~~~
$(container).relatedposts(options);
~~~

`container` should be a valid jQuery selector. `options` should be an object
with key/value pairs.

Possible options
----------------

`domain`:       Your tumblr domain name e.g. mytumblr.tumblr.com. Defaults to
                current document domain.  
`num`:          Max. number of related posts to display.  
`len`:          Excerpt text length (number of characters).  
`thumbwidth`:   Preferred thumbnail width in px (height will scale accordingly).  
`tags`:         Array of post tags to search for.  
`type`:         Limit posts to type. Empty string ('') for all types.  
`titlehtml`:    HTML for the title tag (will be inserted before the container).  

The only required option is the `tags` option, which should be an
array of post tags.

Minimal example
---------------

Assuming you have a container with ID `related` in which you want to display,
insert this just before the closing `</body>` of your theme (change your
domain/path accordingly, and leave jQuery out if it is already included on the
page):

~~~
{block:PermalinkPage}
    <script src="//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js">
    </script>
    {block:Posts}
        {block:HasTags}
            <script src="//yourdomain.com/js/related.js"></script>
            <script>
                $('#related').relatedposts(
                    {tags: [{block:Tags}'{Tag}',{/block:Tags}]});
            </script>
        {/block:HasTags}
    {/block:Posts}
{/block:PermalinkPage}
~~~

You could also pull the tags via jQuery (in the example assuming post tags are
displayed as links in a container with the class `tags`):

~~~
{block:PermalinkPage}
    <script src="//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js">
    </script>
    {block:Posts}
        {block:HasTags}
            <script src="//yourdomain.com/js/related.js"></script>
            <script>
                $('#related').relatedposts(
                    {tags: $('.tags a').map(function() {
                               return $(this).text().replace(/^#/, '');
                           }).get()});
            </script>
        {/block:HasTags}
    {/block:Posts}
{/block:PermalinkPage}
~~~
