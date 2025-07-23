// OpenSCAD program to create 4cm circles in a triangular grid pattern
// 6 circles per row on rows 1 and 3, 5 circles per row on rows 2 and 4
// Centers are 6cm apart

// Circle parameters
circle_diameter = 40; // 4cm = 40mm
circle_radius = circle_diameter / 2;
line_width = 2; // 2mm line width
center_distance = 60; // 6cm = 60mm

// Triangular grid offset
row_height = center_distance * sin(60); // Height between rows in triangular grid
horizontal_offset = center_distance / 2; // Offset for alternating rows

module create_circle(x, y) {
    translate([x, y, 0])
        color("black")
            difference() {
                cylinder(h = 2, r = circle_radius, center = true);
                cylinder(h = 3, r = circle_radius - line_width, center = true);
            }
}

// Main pattern
union() {
    // Row 1 (bottom) - 6 circles
    for (i = [0:5]) {
        create_circle(i * center_distance, 0);
    }

    // Row 2 - 5 circles (offset by half spacing)
    for (i = [0:4]) {
        create_circle(i * center_distance + horizontal_offset, row_height);
    }

    // Row 3 - 6 circles
    for (i = [0:5]) {
        create_circle(i * center_distance, 2 * row_height);
    }

    // Row 4 (top) - 5 circles (offset by half spacing)
    for (i = [0:4]) {
        create_circle(i * center_distance + horizontal_offset, 3 * row_height);
    }
}

// Optional: Add a base plate to see the pattern better
// Uncomment the following lines if you want a base plate
/*
translate([center_distance * 2.5, row_height * 1.5, -2])
    cube([center_distance * 6, row_height * 4, 1], center = true);
*/
