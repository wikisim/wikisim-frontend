
Requirements for the text editor components:

We have several different text entry field use cases that we need to support.

<table>
  <tr>
    <th style="width: 290px;"></th>
    <th style="width: 1000px;">Features</th>
  </tr>
</table>

| Use case                    | "@"              | chips            | Markdown        | \<img\>         | 1st Focus | Select all text |
| --------------------------- | ---------------- | ---------------- | --------------- | --------------- | --------- | --------------- |
| Component title field       | ✅               | ✅               | ❌ <sup>1</sup> | ❌ <sup>1</sup> | ✅        | ~               |
| Component description field | ✅               | ✅               | ✅              | ✅              | ~         | ~               |
| Search text entry           | ❌               | ❌               | ❌              | ❌              | ✅        | ✅              |
| Number value                | ✅? <sup>2</sup> | ✅? <sup>2</sup> | ❌              | ❌              | ~         | ~               |
| Date entry                  | ❌?              | ❌?              | ❌              | ❌              | ~         | ~               |
| Filter options <sup>3</sup> | ❌               | ❌               | ❌              | ❌              | ~         | ~               |

* <sup>1</sup> We want to disable markdown for the component title field to keep them simple and consistent for users to read.
* <sup>2</sup> currently plan to allow referencing other values, but maybe not from a number field, not sure yet.
* <sup>3</sup> Text entry to filter a list of options and select a single or multiple values from that list.



### General Behaviors

* Should allow for enabling/disabling editing.
* Should allow for enforcing single line input or allow multi line input.
* Should allow for enabling/disabling markdown and rich text and indepedent of that, disabling/enabling chips.
* 1st Focus -- Should allow for specifying whether it is focused when it first renders
* Select all text -- Should allow for specifying whether when it is focused on first render, if all of it's text is then selected automatically for the user.

### Data Format

* Should allow for the rich text to be converted into a string / JSON to be saved as a string / JSON field in a database.
* Should allow for the rich text to be converted into a plain text for indexing and searching.
* Data format should be resistant to corruption such that some error in the text does not cause the entire text to be lost or corrupted.

### Shortcuts

* "@" -- Should allow for the user typing an "@" symbol to trigger a call back which will allow for logic to present the user with a rich search modal...
* chips -- Upon the user selecting an item from this modal, the text should be updated with a "chip" i.e. a little component that can be deleted or edited or cut and pasted somewhere else in this body of text or another body of text.
* Should allow for the user to select some text and then right click to get a context menu that allows them to copy, cut, paste, delete, edit, etc.
* Should allow for the user to select some text and then right click to get a context menu that allows them to format the text, e.g. bold, italic, underline, strikethrough, etc.
* Should allow for the user to select some text and then use keyboard shortcuts to format the text, e.g. Ctrl+B for bold, Ctrl+I for italic, etc.
* Markdown -- Should allow for the user to use markdown shortcut key strokes like "##" to format the text, e.g. "##" for a level 2 heading, "*" for a bullet point, etc.
* \<img\> -- Should allow for the user to add an image by us providing an editor for \<img\> html tag to insert images (for now we don't want to host images ourselves).  Requires URL, height, width, alt text.
* Should allow for the user to select some text and then use keyboard shortcuts to insert a link, e.g. Ctrl+K for a link.

### Chips
* Can reference other components, e.g. a person, place, thing, etc.
* Should allow for the user to change the chip text to reference the value of that component (if it has a value), and to customise the text to have a prefix, suffix, format the value ("3e3", "3,000", "3000", "3 thousand", etc.), format the units ("£3k per home" i.e. natural, "3 k£ / home" i.e. scientific).
* Should be shown as an underlined link (keep flexibility to show as a button or other style).
* Should allow for a modifier to specify the alternative / new value of the chip and give a % change i.e. <u style="color: rgb(27, 117, 208);">20 million homes</u> can become <u style="color: #FFA600"><span style="color: rgb(27, 117, 208);">25 million</span> (+25%) <span style="color: rgb(27, 117, 208);">homes</span></u>

### Date Entry Validation
* Should allow for the user to enter a date and check its format is valid. i.e.
  * should be allowed to enter "202" but then have the text editor change to pinky-red to show it is invalid.
  * should be allowed to enter "2025" but then have the text editor change to white and also show inferred resolution as "year"
  * (should allow for user to enter "2020" and change resolution to decade)
  * (should allow for user to enter "2000" and change resolution to century or millennium)

# Components required

## TextEditorSimple

| Use case                    | 1st Focus | Select all text |
| --------------------------- | --------- | --------------- |
| Search text entry           | ✅        | ✅              |
| Filter options <sup>3</sup> | ~         | ~               |


## TextEditorRich

| Use case                    | "@"              | chips            | Markdown        | \<img\>         | 1st Focus |
| --------------------------- | ---------------- | ---------------- | --------------- | --------------- | --------- |
| Component title field       | ✅               | ✅               | ❌ <sup>1</sup> | ❌ <sup>1</sup> | ✅        |
| Component description field | ✅               | ✅               | ✅              | ✅              | ~         |
| Number value                | ✅? <sup>2</sup> | ✅? <sup>2</sup> | ❌              | ❌              | ~         |
| Date entry                  | ❌?              | ❌?              | ❌              | ❌              | ~         |



@ in toolbar -- show "shortcut: @"
URL in toolbar -- show "shortcut: Ctrl + K"
Image in toolbar
Fix deleting reference replacing it with an @
Allow for formatting chips
