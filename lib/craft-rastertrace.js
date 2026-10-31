/* RasterTrace: raster to clean, scalable SVG (ClipArtCraft's own copy, from ImageCraft's, bundled to work offline and from file://).
   RasterTrace by bradsec (MIT), https://github.com/bradsec/rastertrace (0151892): js/preprocess.js, js/palette.js, js/vectorexport.js and its VTracer 1.0
   WebAssembly build (pkg/), turned into one classic script with the WebAssembly embedded; the driver below runs the same steps
   in the same order as its js/worker.js. The EPS writer follows GetVect's (craigjmidwinter/getvect, MIT). VTracer and visioncortex by VisionCortex (MIT / Apache-2.0, the MIT option).

MIT License

Copyright (c) 2026 bradsec

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

--- Third-party licences, as shipped with RasterTrace ---
rastertrace bundles the following third-party open-source libraries in its
WebAssembly tracing module and interface. Their license terms are reproduced
below.

================================================================================
Material Design Icons  -  https://github.com/google/material-design-icons
================================================================================

Copyright Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

================================================================================
vtracer  -  https://github.com/visioncortex/vtracer
================================================================================

MIT License

Copyright (c) 2024 TSANG, Hao Fung

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

================================================================================
visioncortex  -  https://github.com/visioncortex/visioncortex
================================================================================

Licensed under MIT OR Apache-2.0; the MIT option is used here.

MIT License

Copyright (c) 2026 TSANG, Hao Fung

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

================================================================================
wasm-bindgen, wasm-bindgen-shared  -  https://github.com/wasm-bindgen/wasm-bindgen
================================================================================

Licensed under MIT OR Apache-2.0; the MIT option is used here.

Copyright (c) 2014 Alex Crichton

Permission is hereby granted, free of charge, to any
person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the
Software without restriction, including without
limitation the rights to use, copy, modify, merge,
publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software
is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice
shall be included in all copies or substantial portions
of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF
ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT
SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR
IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.

================================================================================
aliasable  -  https://github.com/avitex/rust-aliasable
================================================================================

The MIT License (MIT)

Copyright (c) 2020 James Dyson <avitex@wfxlabs.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

================================================================================
bit-vec  -  https://github.com/contain-rs/bit-vec
================================================================================

Licensed under MIT OR Apache-2.0; the MIT option is used here.

Copyright (c) 2015 The Rust Project Developers

Permission is hereby granted, free of charge, to any
person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the
Software without restriction, including without
limitation the rights to use, copy, modify, merge,
publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software
is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice
shall be included in all copies or substantial portions
of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF
ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT
SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR
IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.

================================================================================
cfg-if  -  https://github.com/rust-lang/cfg-if
================================================================================

Licensed under MIT OR Apache-2.0; the MIT option is used here.

Copyright (c) 2014 Alex Crichton

Permission is hereby granted, free of charge, to any
person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the
Software without restriction, including without
limitation the rights to use, copy, modify, merge,
publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software
is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice
shall be included in all copies or substantial portions
of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF
ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT
SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR
IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.

================================================================================
either  -  https://github.com/rayon-rs/either
================================================================================

Licensed under MIT OR Apache-2.0; the MIT option is used here.

Copyright (c) 2015

Permission is hereby granted, free of charge, to any
person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the
Software without restriction, including without
limitation the rights to use, copy, modify, merge,
publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software
is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice
shall be included in all copies or substantial portions
of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF
ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT
SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR
IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.

================================================================================
itertools  -  https://github.com/rust-itertools/itertools
================================================================================

Licensed under MIT OR Apache-2.0; the MIT option is used here.

Copyright (c) 2015

Permission is hereby granted, free of charge, to any
person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the
Software without restriction, including without
limitation the rights to use, copy, modify, merge,
publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software
is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice
shall be included in all copies or substantial portions
of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF
ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT
SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR
IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.

================================================================================
num-traits  -  https://github.com/rust-num/num-traits
================================================================================

Licensed under MIT OR Apache-2.0; the MIT option is used here.

Copyright (c) 2014 The Rust Project Developers

Permission is hereby granted, free of charge, to any
person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the
Software without restriction, including without
limitation the rights to use, copy, modify, merge,
publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software
is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice
shall be included in all copies or substantial portions
of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF
ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT
SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR
IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.

================================================================================
once_cell  -  https://github.com/matklad/once_cell
================================================================================

Licensed under MIT OR Apache-2.0; the MIT option is used here.

Permission is hereby granted, free of charge, to any
person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the
Software without restriction, including without
limitation the rights to use, copy, modify, merge,
publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software
is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice
shall be included in all copies or substantial portions
of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF
ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT
SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR
IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.

================================================================================
ouroboros  -  https://github.com/joshua-maros/ouroboros
================================================================================

Licensed under MIT OR Apache-2.0; the MIT option is used here.

MIT License

Copyright (c) 2021 Joshua Maros

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

================================================================================
smallvec  -  https://github.com/servo/rust-smallvec
================================================================================

Licensed under MIT OR Apache-2.0; the MIT option is used here.

Copyright (c) 2018 The Servo Project Developers

Permission is hereby granted, free of charge, to any
person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the
Software without restriction, including without
limitation the rights to use, copy, modify, merge,
publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software
is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice
shall be included in all copies or substantial portions
of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF
ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT
SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR
IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.

================================================================================
static_assertions  -  https://github.com/nvzqz/static-assertions-rs
================================================================================

Licensed under MIT OR Apache-2.0; the MIT option is used here.

MIT License

Copyright (c) 2017 Nikolai Vazquez

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

================================================================================
unicode-ident  -  https://github.com/dtolnay/unicode-ident
================================================================================

Licensed under (MIT OR Apache-2.0) AND Unicode-3.0; the MIT option is used here,
alongside the Unicode license for its Unicode data.

Permission is hereby granted, free of charge, to any
person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the
Software without restriction, including without
limitation the rights to use, copy, modify, merge,
publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software
is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice
shall be included in all copies or substantial portions
of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF
ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT
SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR
IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.

UNICODE LICENSE V3

COPYRIGHT AND PERMISSION NOTICE

Copyright © 1991-2023 Unicode, Inc.

NOTICE TO USER: Carefully read the following legal agreement. BY
DOWNLOADING, INSTALLING, COPYING OR OTHERWISE USING DATA FILES, AND/OR
SOFTWARE, YOU UNEQUIVOCALLY ACCEPT, AND AGREE TO BE BOUND BY, ALL OF THE
TERMS AND CONDITIONS OF THIS AGREEMENT. IF YOU DO NOT AGREE, DO NOT
DOWNLOAD, INSTALL, COPY, DISTRIBUTE OR USE THE DATA FILES OR SOFTWARE.

Permission is hereby granted, free of charge, to any person obtaining a
copy of data files and any associated documentation (the "Data Files") or
software and any associated documentation (the "Software") to deal in the
Data Files or Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, and/or sell
copies of the Data Files or Software, and to permit persons to whom the
Data Files or Software are furnished to do so, provided that either (a)
this copyright and permission notice appear with all copies of the Data
Files or Software, or (b) this copyright and permission notice appear in
associated Documentation.

THE DATA FILES AND SOFTWARE ARE PROVIDED "AS IS", WITHOUT WARRANTY OF ANY
KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT OF
THIRD PARTY RIGHTS.

IN NO EVENT SHALL THE COPYRIGHT HOLDER OR HOLDERS INCLUDED IN THIS NOTICE
BE LIABLE FOR ANY CLAIM, OR ANY SPECIAL INDIRECT OR CONSEQUENTIAL DAMAGES,
OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS,
WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION,
ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THE DATA
FILES OR SOFTWARE.

Except as contained in this notice, the name of a copyright holder shall
not be used in advertising or otherwise to promote the sale, use or other
dealings in these Data Files or Software without prior written
authorization of the copyright holder.

================================================================================
roots  -  https://github.com/vorot/roots
================================================================================

Copyright (c) 2015, Mikhail Vorotilov
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

================================================================================
flo_curves  -  https://github.com/Logicalshift/flo_curves
================================================================================

Copyright Andrew Hunter. Licensed under the Apache License, Version 2.0:

                                 Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

   TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

   1. Definitions.

      "License" shall mean the terms and conditions for use, reproduction,
      and distribution as defined by Sections 1 through 9 of this document.

      "Licensor" shall mean the copyright owner or entity authorized by
      the copyright owner that is granting the License.

      "Legal Entity" shall mean the union of the acting entity and all
      other entities that control, are controlled by, or are under common
      control with that entity. For the purposes of this definition,
      "control" means (i) the power, direct or indirect, to cause the
      direction or management of such entity, whether by contract or
      otherwise, or (ii) ownership of fifty percent (50%) or more of the
      outstanding shares, or (iii) beneficial ownership of such entity.

      "You" (or "Your") shall mean an individual or Legal Entity
      exercising permissions granted by this License.

      "Source" form shall mean the preferred form for making modifications,
      including but not limited to software source code, documentation
      source, and configuration files.

      "Object" form shall mean any form resulting from mechanical
      transformation or translation of a Source form, including but
      not limited to compiled object code, generated documentation,
      and conversions to other media types.

      "Work" shall mean the work of authorship, whether in Source or
      Object form, made available under the License, as indicated by a
      copyright notice that is included in or attached to the work
      (an example is provided in the Appendix below).

      "Derivative Works" shall mean any work, whether in Source or Object
      form, that is based on (or derived from) the Work and for which the
      editorial revisions, annotations, elaborations, or other modifications
      represent, as a whole, an original work of authorship. For the purposes
      of this License, Derivative Works shall not include works that remain
      separable from, or merely link (or bind by name) to the interfaces of,
      the Work and Derivative Works thereof.

      "Contribution" shall mean any work of authorship, including
      the original version of the Work and any modifications or additions
      to that Work or Derivative Works thereof, that is intentionally
      submitted to Licensor for inclusion in the Work by the copyright owner
      or by an individual or Legal Entity authorized to submit on behalf of
      the copyright owner. For the purposes of this definition, "submitted"
      means any form of electronic, verbal, or written communication sent
      to the Licensor or its representatives, including but not limited to
      communication on electronic mailing lists, source code control systems,
      and issue tracking systems that are managed by, or on behalf of, the
      Licensor for the purpose of discussing and improving the Work, but
      excluding communication that is conspicuously marked or otherwise
      designated in writing by the copyright owner as "Not a Contribution."

      "Contributor" shall mean Licensor and any individual or Legal Entity
      on behalf of whom a Contribution has been received by Licensor and
      subsequently incorporated within the Work.

   2. Grant of Copyright License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      copyright license to reproduce, prepare Derivative Works of,
      publicly display, publicly perform, sublicense, and distribute the
      Work and such Derivative Works in Source or Object form.

   3. Grant of Patent License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      (except as stated in this section) patent license to make, have made,
      use, offer to sell, sell, import, and otherwise transfer the Work,
      where such license applies only to those patent claims licensable
      by such Contributor that are necessarily infringed by their
      Contribution(s) alone or by combination of their Contribution(s)
      with the Work to which such Contribution(s) was submitted. If You
      institute patent litigation against any entity (including a
      cross-claim or counterclaim in a lawsuit) alleging that the Work
      or a Contribution incorporated within the Work constitutes direct
      or contributory patent infringement, then any patent licenses
      granted to You under this License for that Work shall terminate
      as of the date such litigation is filed.

   4. Redistribution. You may reproduce and distribute copies of the
      Work or Derivative Works thereof in any medium, with or without
      modifications, and in Source or Object form, provided that You
      meet the following conditions:

      (a) You must give any other recipients of the Work or
          Derivative Works a copy of this License; and

      (b) You must cause any modified files to carry prominent notices
          stating that You changed the files; and

      (c) You must retain, in the Source form of any Derivative Works
          that You distribute, all copyright, patent, trademark, and
          attribution notices from the Source form of the Work,
          excluding those notices that do not pertain to any part of
          the Derivative Works; and

      (d) If the Work includes a "NOTICE" text file as part of its
          distribution, then any Derivative Works that You distribute must
          include a readable copy of the attribution notices contained
          within such NOTICE file, excluding those notices that do not
          pertain to any part of the Derivative Works, in at least one
          of the following places: within a NOTICE text file distributed
          as part of the Derivative Works; within the Source form or
          documentation, if provided along with the Derivative Works; or,
          within a display generated by the Derivative Works, if and
          wherever such third-party notices normally appear. The contents
          of the NOTICE file are for informational purposes only and
          do not modify the License. You may add Your own attribution
          notices within Derivative Works that You distribute, alongside
          or as an addendum to the NOTICE text from the Work, provided
          that such additional attribution notices cannot be construed
          as modifying the License.

      You may add Your own copyright statement to Your modifications and
      may provide additional or different license terms and conditions
      for use, reproduction, or distribution of Your modifications, or
      for any such Derivative Works as a whole, provided Your use,
      reproduction, and distribution of the Work otherwise complies with
      the conditions stated in this License.

   5. Submission of Contributions. Unless You explicitly state otherwise,
      any Contribution intentionally submitted for inclusion in the Work
      by You to the Licensor shall be under the terms and conditions of
      this License, without any additional terms or conditions.
      Notwithstanding the above, nothing herein shall supersede or modify
      the terms of any separate license agreement you may have executed
      with Licensor regarding such Contributions.

   6. Trademarks. This License does not grant permission to use the trade
      names, trademarks, service marks, or product names of the Licensor,
      except as required for reasonable and customary use in describing the
      origin of the Work and reproducing the content of the NOTICE file.

   7. Disclaimer of Warranty. Unless required by applicable law or
      agreed to in writing, Licensor provides the Work (and each
      Contributor provides its Contributions) on an "AS IS" BASIS,
      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
      implied, including, without limitation, any warranties or conditions
      of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
      PARTICULAR PURPOSE. You are solely responsible for determining the
      appropriateness of using or redistributing the Work and assume any
      risks associated with Your exercise of permissions under this License.

   8. Limitation of Liability. In no event and under no legal theory,
      whether in tort (including negligence), contract, or otherwise,
      unless required by applicable law (such as deliberate and grossly
      negligent acts) or agreed to in writing, shall any Contributor be
      liable to You for damages, including any direct, indirect, special,
      incidental, or consequential damages of any character arising as a
      result of this License or out of the use or inability to use the
      Work (including but not limited to damages for loss of goodwill,
      work stoppage, computer failure or malfunction, or any and all
      other commercial damages or losses), even if such Contributor
      has been advised of the possibility of such damages.

   9. Accepting Warranty or Additional Liability. While redistributing
      the Work or Derivative Works thereof, You may choose to offer,
      and charge a fee for, acceptance of support, warranty, indemnity,
      or other liability obligations and/or rights consistent with this
      License. However, in accepting such obligations, You may act only
      on Your own behalf and on Your sole responsibility, not on behalf
      of any other Contributor, and only if You agree to indemnify,
      defend, and hold each Contributor harmless for any liability
      incurred by, or claims asserted against, such Contributor by reason
      of your accepting any such warranty or additional liability.

   END OF TERMS AND CONDITIONS

   APPENDIX: How to apply the Apache License to your work.

      To apply the Apache License to your work, attach the following
      boilerplate notice, with the fields enclosed by brackets "[]"
      replaced with your own identifying information. (Don't include
      the brackets!)  The text should be enclosed in the appropriate
      comment syntax for the file format. We also recommend that a
      file or class name and description of purpose be included on the
      same "printed page" as the copyright notice for easier
      identification within third-party archives.

   Copyright [yyyy] [name of copyright owner]

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.

*/
(function () {
'use strict';
// ---------------------------------------------------------------- js/preprocess.js
// Pure pixel and string operations for the rastertrace pipeline.
// Every function here runs in Node (tests) and the browser (worker/app):
// images are plain { data: Uint8ClampedArray, width, height } RGBA buffers.

const ALPHA_THRESHOLD = 128;

// Upper bound on upscaled pixels sent to the tracer. Beyond this the
// RGBA buffers alone run to hundreds of MB and canvas/wasm allocation
// fails with opaque platform errors, so fail early with a clear one.
const MAX_TRACE_PIXELS = 64_000_000;

// Longest side sent to the tracer, on every device. Upscale never pushes
// past it and larger sources are reduced to it, proportions kept: tracing
// gains no detail beyond this, and a 12 MP camera photo at 2x (49 MP,
// ~200 MB per RGBA copy) crashed iOS Safari, which kills a tab around
// 1-1.5 GB. 2048x2048 tops out at 4.2 MP.
const MAX_TRACE_SIDE = 2048;

// Opt-in "Ultra" ceiling for fabrication exports (laser, cutting): 4096
// on the longest side is 16.8 MP, ~67 MB per RGBA copy. Desktop handles
// it; low-memory mobile devices may not, so it never becomes the default.
const MAX_TRACE_SIDE_ULTRA = 4096;

// Pixel settings (Smallest shape, clean specks, edge smooth, edge trim,
// defringe, wand expand) were tuned at the former 2x default trace scale.
const REFERENCE_SCALE = 2;

/**
 * A pixel setting in trace pixels at `scale` (trace px per source px), so
 * it covers the same part of the image whatever the upscale. A set value
 * never rounds away to nothing; 0 stays off.
 */
function tracePixels(value, scale) {
  if (value <= 0) return 0;
  return Math.max(1, Math.round((value * scale) / REFERENCE_SCALE));
}

/**
 * Effective scale factor for tracing: the requested upscale, capped so
 * the longest side never exceeds maxSide. Below 1 the image is
 * downscaled before tracing.
 */
function fitTraceScale(width, height, upscale, maxSide = MAX_TRACE_SIDE) {
  return Math.min(upscale, maxSide / Math.max(width, height));
}

/**
 * Throw a readable error when width x height at the given upscale factor
 * exceeds MAX_TRACE_PIXELS. Returns the upscaled pixel count otherwise.
 */
function assertRasterBudget(width, height, upscale) {
  const pixels = width * upscale * height * upscale;
  if (pixels > MAX_TRACE_PIXELS) {
    const mp = (n) => `${Math.round(n / 1e6)} MP`;
    throw new Error(
      `Image is too large to trace at ${upscale}x (${mp(pixels)}; limit ${mp(MAX_TRACE_PIXELS)}). Lower the upscale factor or use a smaller image.`,
    );
  }
  return pixels;
}

const DEFAULTS = Object.freeze({
  autoDetect: true,
  colors: 256,
  speckle: 8,
  layerDiff: 16,
  upscale: "auto",
  mode: "spline",
  cornerThreshold: 60,
  hierarchical: "stacked",
  grayscale: false,
  denoise: false,
  transparent: "",
  fuzz: 16,
  contiguous: false,
  enclosed: false,
  enclosedSize: 16,
  enclosedMaxSize: 512, // ENCLOSED_NO_LIMIT: declared below DEFAULTS
  gradient: false,
  specks: 0,
  edgeTrim: 0,
  edgeSmooth: 0,
  defringe: 0,
  stencil: false,
  stencilThreshold: 128,
  stencilInk: "black",
  pathPrecision: 3,
  lengthThreshold: 4,
  spliceThreshold: 45,
  straighten: 0,
});

// Keyed by color count. Speckle and layer difference scale inversely:
// fewer colors means flat print-style output, so cleanup gets more
// aggressive; more colors means detail retention matters.
const PRESETS = Object.freeze({
  2: { colors: 2, speckle: 16, layerDiff: 48 },
  3: { colors: 3, speckle: 16, layerDiff: 32 },
  4: { colors: 4, speckle: 12, layerDiff: 28 },
  6: { colors: 6, speckle: 10, layerDiff: 26 },
  8: { colors: 8, speckle: 8, layerDiff: 24 },
  16: { colors: 16, speckle: 8, layerDiff: 16 },
  32: { colors: 32, speckle: 4, layerDiff: 16 },
  64: { colors: 64, speckle: 4, layerDiff: 12 },
  128: { colors: 128, speckle: 2, layerDiff: 8 },
  // 256 (no quantize/modeFilter pass — see js/worker.js) needs more
  // cleanup than 128, not less: raw source noise reaches the tracer
  // untouched, so despeckle/layer merging stay above the 128 entry
  // instead of continuing to taper off.
  256: { colors: 256, speckle: 3, layerDiff: 10 },
});

// The Simplify slider, like Illustrator's Paths slider: one control over
// both curve-fitting tolerances, from most detail to simplest. Level 3 is
// the default pair, and the detail profiles' pairs are levels too, so a
// profile never shows as Custom.
const SIMPLIFY_LEVELS = Object.freeze([
  { lengthThreshold: 3.5, spliceThreshold: 10 },
  { lengthThreshold: 4, spliceThreshold: 20 },
  { lengthThreshold: 4, spliceThreshold: 30 },
  { lengthThreshold: 4, spliceThreshold: 45 },
  { lengthThreshold: 6, spliceThreshold: 60 },
  { lengthThreshold: 8, spliceThreshold: 75 },
  { lengthThreshold: 10, spliceThreshold: 90 },
]);

/** Index of the Simplify level with exactly these tolerances, or -1. */
function simplifyLevel(lengthThreshold, spliceThreshold) {
  return SIMPLIFY_LEVELS.findIndex(
    (l) => l.lengthThreshold === lengthThreshold && l.spliceThreshold === spliceThreshold,
  );
}

/**
 * Color settings auto-detection derives from one image's analyzeFlatness
 * result. Flat art snaps colors to the detected count and takes cleanup
 * from the nearest preset at or above it; photographic sources get the
 * defaults, so a photo loaded after flat art does not inherit its
 * reduced palette.
 *
 * @param {{ flat: boolean, colorCount: number, solids?: number[][] }} analysis
 */
function detectedColorSettings({ flat, colorCount, solids }) {
  if (!flat) {
    return { colors: DEFAULTS.colors, speckle: DEFAULTS.speckle, layerDiff: DEFAULTS.layerDiff };
  }
  const key = Object.keys(PRESETS)
    .map(Number)
    .sort((a, b) => a - b)
    .find((k) => k >= colorCount);
  const preset = PRESETS[key ?? 256];
  // The tracer merges neighboring layers whose colors differ by no more
  // than Merge, so stay under half the closest pair of detected colors.
  let layerDiff = preset.layerDiff;
  if (solids && solids.length > 1) {
    let closest = Infinity;
    for (let i = 0; i < solids.length; i++) {
      for (let j = i + 1; j < solids.length; j++) {
        closest = Math.min(closest, colorDistance(solids[i], solids[j]));
      }
    }
    layerDiff = Math.min(layerDiff, Math.max(1, Math.floor(closest / 2)));
  }
  return { colors: colorCount, speckle: preset.speckle, layerDiff };
}

/**
 * Color settings for an auto-detect profile on one image: flat art keeps
 * its own color count (never above the profile's) with Merge below its
 * closest pair of colors; photos keep the profile's values. Smallest
 * shape is always the profile's, as it sets the profile's detail level.
 *
 * @param {{ colors: number, speckle: number, layerDiff: number }} profile
 * @param {{ flat: boolean, colorCount: number, solids?: number[][] }} analysis
 */
function profileColorSettings(profile, analysis) {
  if (!analysis.flat) {
    return { colors: profile.colors, speckle: profile.speckle, layerDiff: profile.layerDiff };
  }
  const detected = detectedColorSettings(analysis);
  return {
    colors: Math.min(detected.colors, profile.colors),
    speckle: profile.speckle,
    layerDiff: Math.min(detected.layerDiff, profile.layerDiff),
  };
}

/** The tracer's color difference: the sum of the RGB channel differences. */
function colorDistance(a, b) {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
}

/**
 * How many of the detected `solids` (most common first) keep a color of
 * their own once Merge applies: each is dropped when within `layerDiff`
 * of a more common color already kept, as quantize seeds flat art. Never
 * below the Max colors minimum of 2.
 */
function distinctColorCount(solids, layerDiff) {
  return Math.max(2, distinctColors(solids, layerDiff).length);
}

/** The `solids` distinctColorCount keeps, most common first. */
function distinctColors(solids, layerDiff) {
  const kept = [];
  for (const color of solids) {
    if (kept.every((other) => colorDistance(color, other) > layerDiff)) kept.push(color);
  }
  return kept;
}

// Purpose-based export profiles (SVG_EXPORT_RESEARCH.md). `autoDetect`
// profiles keep color auto-detection on: flat art takes its own colors
// within the profile (profileColorSettings), photos the profile's values. Values are
// applied to the visible controls like PRESETS: users can edit them
// afterwards. pathPrecision/spliceThreshold feed the tracer directly;
// minify/stencil toggle post-processing and binary color mode.
const EXPORT_PROFILES = Object.freeze({
  web: {
    colors: 16,
    speckle: 10,
    layerDiff: 24,
    mode: "spline",
    cornerThreshold: 60,
    hierarchical: "stacked",
    pathPrecision: 1,
    upscale: "auto",
    straighten: 1,
    minify: true,
    stencil: false,
  },
  balanced: {
    colors: 256,
    speckle: 8,
    layerDiff: 16,
    mode: "spline",
    cornerThreshold: 60,
    hierarchical: "stacked",
    pathPrecision: 2,
    upscale: "auto",
    straighten: 0.5,
    minify: false,
    stencil: false,
    autoDetect: true,
  },
  detail: {
    colors: 64,
    speckle: 2,
    layerDiff: 8,
    mode: "spline",
    cornerThreshold: 45,
    hierarchical: "stacked",
    pathPrecision: 4,
    spliceThreshold: 30,
    upscale: "auto",
    straighten: 0,
    minify: false,
    stencil: false,
    autoDetect: true,
  },
  maxDetail: {
    colors: 128,
    speckle: 1,
    layerDiff: 6,
    mode: "spline",
    cornerThreshold: 25,
    hierarchical: "stacked",
    pathPrecision: 4,
    spliceThreshold: 20,
    upscale: "auto",
    straighten: 0,
    minify: false,
    stencil: false,
    autoDetect: true,
  },
  // mode "none" (below) skips all curve/corner simplification, so colors
  // are the only lever bounding path count. Speckle must be 0: at any other
  // value the tracer drops every region whose perimeter is at least its
  // area, which is every lone pixel and block up to 4x4, the very detail
  // pixel art is made of. Upscale 1: pixel edges need no resampling, and
  // each source pixel stays one trace pixel. 16 colors covers most pixel
  // art palettes; a photographic source still explodes (measured: a
  // 1.92 MP noisy source gave 154,902 paths / 17 MB in 3.8s at 16 colors)
  // but stays traceable, where 64 colors risked a tab crash.
  pixelExact: {
    colors: 16,
    speckle: 0,
    layerDiff: 6,
    mode: "none",
    cornerThreshold: 60,
    hierarchical: "stacked",
    pathPrecision: 4,
    spliceThreshold: 45,
    upscale: 1,
    straighten: 0,
    minify: false,
    stencil: false,
  },
  print: {
    colors: 8,
    speckle: 12,
    layerDiff: 28,
    mode: "spline",
    cornerThreshold: 45,
    hierarchical: "stacked",
    pathPrecision: 3,
    upscale: "auto",
    straighten: 1,
    minify: false,
    stencil: false,
  },
  monoBlack: {
    colors: 2,
    speckle: 6,
    layerDiff: 48,
    mode: "spline",
    cornerThreshold: 25,
    hierarchical: "stacked",
    pathPrecision: 4,
    upscale: "auto",
    straighten: 1,
    minify: false,
    stencil: true,
    stencilInk: "black",
  },
  monoWhite: {
    colors: 2,
    speckle: 6,
    layerDiff: 48,
    mode: "spline",
    cornerThreshold: 25,
    hierarchical: "stacked",
    pathPrecision: 4,
    upscale: "auto",
    straighten: 1,
    minify: false,
    stencil: true,
    stencilInk: "white",
  },
  laser: {
    colors: 2,
    speckle: 12,
    layerDiff: 48,
    mode: "spline",
    cornerThreshold: 30,
    hierarchical: "stacked",
    pathPrecision: 3,
    upscale: "auto",
    straighten: 1.5,
    minify: false,
    stencil: true,
  },
  // Multi-color vinyl (Cricut, Silhouette, plotters): Cutout layering
  // makes each color its own pieces with no overlap, so layers weed and
  // stack cleanly; strong despeckle spares tiny pieces nobody can weed.
  vinyl: {
    colors: 6,
    speckle: 16,
    layerDiff: 28,
    mode: "spline",
    cornerThreshold: 45,
    hierarchical: "cutout",
    pathPrecision: 3,
    upscale: "auto",
    straighten: 1.5,
    minify: false,
    stencil: false,
  },
  // Scanned sketches and ink drawings: denoise clears paper grain before
  // the threshold, and a lighter threshold than 128 keeps pencil strokes.
  lineArt: {
    colors: 2,
    speckle: 8,
    layerDiff: 48,
    mode: "spline",
    cornerThreshold: 45,
    hierarchical: "stacked",
    pathPrecision: 3,
    upscale: "auto",
    straighten: 0.5,
    minify: false,
    stencil: true,
    stencilInk: "black",
    stencilThreshold: 180,
    denoise: true,
  },
  // Logos and icons: flat colors, crisp corners, long straight runs and
  // few nodes, minified for the smallest file.
  icon: {
    colors: 8,
    speckle: 10,
    layerDiff: 24,
    mode: "spline",
    cornerThreshold: 45,
    hierarchical: "stacked",
    pathPrecision: 1,
    lengthThreshold: 6,
    spliceThreshold: 60,
    upscale: "auto",
    straighten: 2,
    minify: true,
    stencil: false,
  },
});

function stripInvalidXmlCharacters(value) {
  let result = "";
  for (const character of String(value)) {
    const codePoint = character.codePointAt(0);
    if (
      codePoint === 0x09 ||
      codePoint === 0x0a ||
      codePoint === 0x0d ||
      (codePoint >= 0x20 && codePoint <= 0xd7ff) ||
      (codePoint >= 0xe000 && codePoint <= 0xfffd) ||
      (codePoint >= 0x10000 && codePoint <= 0x10ffff)
    ) {
      result += character;
    }
  }
  return result;
}

/**
 * Post-process a finalized SVG for export. Options:
 * - minify: drop the XML declaration and generator comment, and compress
 *   path data (relative commands, baked translates).
 * - physicalWidth + physicalUnit ("px"|"mm"|"cm"|"in"): rewrite the root
 *   width/height to the requested unit, height from the pixel aspect ratio,
 *   keeping the viewBox so the file still scales.
 * - title: insert an escaped <title> as the first child and role="img".
 *
 * @param {string} svgText
 * @param {{ physicalWidth?: number, physicalUnit?: string, title?: string, minify?: boolean }} [options]
 */
function applyExportOptions(svgText, { physicalWidth, physicalUnit, title, minify } = {}) {
  let out = svgText;
  if (minify) {
    out = compressSvgPaths(out.replace(/^<\?xml[^?]*\?>\s*/, "").replace(/^<!--.*?-->\s*/s, ""));
  }
  if (physicalWidth > 0 && physicalUnit) {
    out = out.replace(
      /(<svg[^>]*?) width="(\d+)" height="(\d+)"( viewBox="[^"]*")/,
      (_, head, w, h, vb) => {
        const height = Number((physicalWidth * (h / w)).toFixed(2));
        return `${head} width="${physicalWidth}${physicalUnit}" height="${height}${physicalUnit}"${vb}`;
      },
    );
  }
  if (title) {
    const escaped = stripInvalidXmlCharacters(title)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    out = out.replace(
      /(<svg[^>]*)>/,
      (_, head) => `${head} role="img">\n<title>${escaped}</title>`,
    );
  }
  return out;
}

// Compact decimal for compressed path data: at most 4 places, trailing
// zeros trimmed, "0.5" as ".5", "-0" as "0".
function compactNum(n) {
  let s = n
    .toFixed(4)
    .replace(/(\.\d*?)0+$/, "$1")
    .replace(/\.$/, "");
  if (s === "-0") s = "0";
  return s.replace(/^(-?)0\./, "$1.");
}

/**
 * Shrink traced SVG path data for export: bakes each path's
 * translate() into its coordinates, converts absolute M/L/C/Z commands
 * to relative ones with h/v/s shorthands and implicit repetition, and
 * trims number formatting. Paths with any other command or transform are
 * left untouched. The output is for the SVG download only; it no longer
 * matches the absolute shape parseSvgPaths expects.
 */
function compressSvgPaths(svgText) {
  return svgText.replace(/<path\b[^>]*\/>/g, (path) => {
    const d = path.match(/\sd="([^"]*)"/)?.[1];
    if (!d) return path;
    const tr = path.match(/\stransform="([^"]*)"/)?.[1];
    let dx = 0;
    let dy = 0;
    if (tr) {
      const m = tr.match(/^translate\((-?[\d.]+)[, ](-?[\d.]+)\)$/);
      if (!m) return path;
      dx = Number(m[1]);
      dy = Number(m[2]);
    }
    const compressed = compressPathData(d, dx, dy);
    if (compressed === null) return path;
    return path
      .replace(/(\sd=")[^"]*(")/, (_, head, tail) => head + compressed + tail)
      .replace(/\s+transform="[^"]*"/, "");
  });
}

function compressPathData(d, dx, dy) {
  const tokens = d.match(/-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?|[A-Za-z]/g) || [];
  let out = "";
  let lastNum = "";
  let lastCmd = "";
  // Position a renderer of the emitted data has reached: deltas are
  // computed against it so rounding never accumulates into drift.
  let ex = 0;
  let ey = 0;
  let startX = 0;
  let startY = 0;
  let prevC2 = null; // absolute second control point of a preceding c/s
  let i = 0;
  const read = () => Number(tokens[i++]);

  const cmd = (letter) => {
    if (letter === lastCmd && (letter === "l" || letter === "c" || letter === "s")) return;
    out += letter;
    lastCmd = letter;
    lastNum = "";
  };
  const num = (n) => {
    const s = compactNum(n);
    if (lastNum && !s.startsWith("-") && !(s.startsWith(".") && lastNum.includes("."))) {
      out += " ";
    }
    out += s;
    lastNum = s;
  };

  let op = null;
  while (i < tokens.length) {
    if (/^[A-Za-z]$/.test(tokens[i])) {
      op = tokens[i++];
      if (op === "Z" || op === "z") {
        cmd("z");
        ex = startX;
        ey = startY;
        prevC2 = null;
        op = null;
        continue;
      }
    }
    switch (op) {
      case "M": {
        const x = read() + dx;
        const y = read() + dy;
        if (out === "") {
          out = "M";
          lastCmd = "M";
          lastNum = "";
          num(x);
          num(y);
        } else {
          cmd("m");
          lastCmd = ""; // pairs after m are implicit lineto, not m
          num(x - ex);
          num(y - ey);
          lastCmd = "l";
        }
        ex = x;
        ey = y;
        startX = x;
        startY = y;
        prevC2 = null;
        op = "L";
        break;
      }
      case "L": {
        const x = read() + dx;
        const y = read() + dy;
        const rx = Number(compactNum(x - ex));
        const ry = Number(compactNum(y - ey));
        if (ry === 0 && rx !== 0) {
          cmd("h");
          num(rx);
        } else if (rx === 0 && ry !== 0) {
          cmd("v");
          num(ry);
        } else {
          cmd("l");
          num(rx);
          num(ry);
        }
        ex += rx;
        ey += ry;
        prevC2 = null;
        break;
      }
      case "C": {
        const c1x = read() + dx;
        const c1y = read() + dy;
        const c2x = read() + dx;
        const c2y = read() + dy;
        const x = read() + dx;
        const y = read() + dy;
        const smooth =
          prevC2 &&
          Math.abs(2 * ex - prevC2.x - c1x) < 5e-5 &&
          Math.abs(2 * ey - prevC2.y - c1y) < 5e-5;
        const coords = smooth ? [c2x, c2y, x, y] : [c1x, c1y, c2x, c2y, x, y];
        cmd(smooth ? "s" : "c");
        const emitted = [];
        for (let k = 0; k < coords.length; k += 2) {
          const rx = Number(compactNum(coords[k] - ex));
          const ry = Number(compactNum(coords[k + 1] - ey));
          num(rx);
          num(ry);
          emitted.push([rx, ry]);
        }
        const [lx, ly] = emitted[emitted.length - 1];
        prevC2 = { x: ex + emitted[emitted.length - 2][0], y: ey + emitted[emitted.length - 2][1] };
        ex += lx;
        ey += ly;
        break;
      }
      default:
        return null; // unexpected command: leave the path untouched
    }
  }
  return out;
}

/**
 * Cut every pixel to pure black or white: r below the threshold goes
 * black, everything else white. Alpha is untouched. Run after
 * toGrayscale so r is luma; this makes the stencil threshold a user
 * control instead of vtracer's fixed cut at 128.
 */
function thresholdImage(img, threshold) {
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = d[i] < threshold ? 0 : 255;
    d[i] = v;
    d[i + 1] = v;
    d[i + 2] = v;
  }
}

/**
 * Paint pixels below the alpha threshold with the given opaque color.
 * Binary (stencil) tracing keys on brightness only and ignores alpha, so
 * transparent areas must become background-colored before the trace.
 */
function fillTransparent(img, [r, g, b]) {
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < ALPHA_THRESHOLD) {
      d[i] = r;
      d[i + 1] = g;
      d[i + 2] = b;
      d[i + 3] = 255;
    }
  }
}

/**
 * Recolor a binary stencil trace for white-ink output: the shapes turn
 * white on transparency, one ink like the black stencil, so nothing extra
 * prints or cuts. Binary stencil traces have exactly one fill value in
 * the whole document, so a blanket replace is safe. No-op for "black".
 */
function applyStencilInk(svgText, ink) {
  if (ink !== "white") return svgText;
  return svgText.replace(/fill="#000000"/g, 'fill="#ffffff"');
}

// Validators for persisted settings. localStorage is untrusted input:
// each entry admits one control's value range and nothing else.
function physicalWidthValue(value) {
  const width = Number(value);
  return Number.isFinite(width) && width > 0 && width <= 100000 ? width : null;
}

const SETTING_CHECKS = {
  profile: (v) =>
    v === "" || v in EXPORT_PROFILES || (typeof v === "string" && userPresetName(v) !== null),
  preset: (v) => typeof v === "string",
  autoDetect: (v) => typeof v === "boolean",
  colors: (v) => Number.isFinite(v) && v >= 2 && v <= 256,
  speckle: (v) => Number.isFinite(v) && v >= 0 && v <= 32,
  layerDiff: (v) => Number.isFinite(v) && v >= 0 && v <= 128,
  cornerThreshold: (v) => Number.isFinite(v) && v >= 0 && v <= 120,
  hierarchical: (v) => v === "stacked" || v === "cutout",
  upscale: (v) => [1, 2, 3, 4, "auto", "ultra"].includes(v),
  mode: (v) => ["spline", "polygon", "none"].includes(v),
  grayscale: (v) => typeof v === "boolean",
  denoise: (v) => typeof v === "boolean",
  stencil: (v) => typeof v === "boolean",
  stencilThreshold: (v) => Number.isFinite(v) && v >= 1 && v <= 254,
  stencilInk: (v) => v === "black" || v === "white",
  transparent: (v) => ["", "edges", "auto", "custom"].includes(v),
  knockoutColor: (v) => typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v),
  fuzz: (v) => Number.isFinite(v) && v >= 0 && v <= 255,
  contiguous: (v) => typeof v === "boolean",
  enclosed: (v) => typeof v === "boolean",
  enclosedSize: (v) => Number.isFinite(v) && v >= 1 && v <= 64,
  enclosedMaxSize: (v) => Number.isFinite(v) && v >= 8 && v <= ENCLOSED_NO_LIMIT,
  gradient: (v) => typeof v === "boolean",
  specks: (v) => Number.isFinite(v) && v >= 0 && v <= 16,
  edgeTrim: (v) => Number.isFinite(v) && v >= 0 && v <= 16,
  edgeSmooth: (v) => Number.isFinite(v) && v >= 0 && v <= 8,
  defringe: (v) => Number.isFinite(v) && v >= 0 && v <= 8,
  pathPrecision: (v) => Number.isFinite(v) && v >= 1 && v <= 4,
  lengthThreshold: (v) => Number.isFinite(v) && v >= 3.5 && v <= 10,
  spliceThreshold: (v) => Number.isFinite(v) && v >= 10 && v <= 90,
  straighten: (v) => Number.isFinite(v) && v >= 0 && v <= 4,
  exportSize: (v) => v === "px" || v === "physical",
  physicalWidth: (v) => typeof v === "number" && physicalWidthValue(v) !== null,
  physicalUnit: (v) => ["px", "mm", "cm", "in"].includes(v),
  minify: (v) => typeof v === "boolean",
  colorSource: (v) => v === "auto" || v === "custom",
  swatches: (v) =>
    Array.isArray(v) &&
    v.length <= SWATCHES_MAX &&
    v.every((c) => typeof c === "string" && /^#[0-9a-fA-F]{6}$/.test(c)),
};

/**
 * Reduce a parsed settings snapshot (e.g. from localStorage) to known
 * keys with in-range values. Anything unknown or invalid is dropped.
 */
function sanitizeSettings(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out = {};
  for (const [key, check] of Object.entries(SETTING_CHECKS)) {
    if (Object.prototype.hasOwnProperty.call(raw, key) && check(raw[key])) {
      out[key] = raw[key];
    }
  }
  return out;
}

const PRESET_NAME_MAX = 40;
const PRESETS_MAX = 50;
/** Export profile select value for a saved user preset. */
const USER_PRESET_PREFIX = "user:";
// A preset stands in for the profile select and turns color auto-detection
// off when applied, so neither is stored inside it.
const PRESET_SESSION_KEYS = ["profile", "autoDetect"];

/** Trimmed preset name without control characters, or null when unusable. */
function presetName(value) {
  if (typeof value !== "string") return null;
  // oxlint-disable-next-line no-control-regex -- stripping them is the point
  const name = value.replace(/[\u0000-\u001f\u007f]/g, "").trim();
  return name && name.length <= PRESET_NAME_MAX ? name : null;
}

/** Preset name from a "user:<name>" profile value, or null. */
function userPresetName(profile) {
  return profile.startsWith(USER_PRESET_PREFIX)
    ? presetName(profile.slice(USER_PRESET_PREFIX.length))
    : null;
}

const sameName = (a, b) => a.toLowerCase() === b.toLowerCase();

/**
 * Validate saved or imported presets: a bare array or an export file's
 * { presets }. Names compare case-insensitively and the first one wins;
 * each preset's settings pass sanitizeSettings. Capped at PRESETS_MAX.
 * @returns {{ name: string, settings: object }[]}
 */
function sanitizePresets(raw) {
  const entries = Array.isArray(raw) ? raw : Array.isArray(raw?.presets) ? raw.presets : [];
  const out = [];
  for (const entry of entries) {
    if (out.length >= PRESETS_MAX) break;
    const name = presetName(entry?.name);
    if (!name || out.some((p) => sameName(p.name, name))) continue;
    const settings = sanitizeSettings(entry.settings);
    for (const key of PRESET_SESSION_KEYS) delete settings[key];
    out.push({ name, settings });
  }
  return out;
}

/**
 * Add `incoming` presets to `list` without mutating it. A same-named
 * preset is replaced in place (or skipped with replace: false); new names
 * append while the list is under PRESETS_MAX.
 */
function mergePresets(list, incoming, { replace = true } = {}) {
  const presets = [...list];
  const added = [];
  const replaced = [];
  const skipped = [];
  for (const preset of incoming) {
    const index = presets.findIndex((p) => sameName(p.name, preset.name));
    if (index >= 0 && replace) {
      presets[index] = preset;
      replaced.push(preset.name);
    } else if (index < 0 && presets.length < PRESETS_MAX) {
      presets.push(preset);
      added.push(preset.name);
    } else {
      skipped.push(preset.name);
    }
  }
  return { presets, added, replaced, skipped };
}

/** Most swatches a fixed palette may hold, like the 256-color ceiling. */
const SWATCHES_MAX = 256;

/**
 * Swatches from pasted text or a text swatch file: a GIMP/Inkscape .gpl
 * palette ("R G B name" rows), otherwise every #RGB, #RRGGBB or bare
 * RRGGBB code in order. Returns unique "#RRGGBB", at most SWATCHES_MAX.
 * @param {string} text
 */
function parseSwatchText(text) {
  const colors = [];
  if (/^\s*GIMP Palette/.test(text)) {
    for (const line of text.split(/\r?\n/)) {
      const m = /^\s*(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})(?:\s|$)/.exec(line);
      const rgb = m && /** @type {[number, number, number]} */ ([
        Number(m[1]),
        Number(m[2]),
        Number(m[3]),
      ]);
      if (rgb && rgb.every((c) => c <= 255)) colors.push(toHexColor(rgb));
    }
  } else {
    for (const [, hex] of text.matchAll(
      /(?:^|[^0-9a-zA-Z#])#?([0-9a-fA-F]{6}|(?<=#)[0-9a-fA-F]{3})(?![0-9a-zA-Z])/g,
    )) {
      const full = hex.length === 3 ? [...hex].map((c) => c + c).join("") : hex;
      colors.push(`#${full.toUpperCase()}`);
    }
  }
  return [...new Set(colors)].slice(0, SWATCHES_MAX);
}

/** CIE Lab (D50, as Adobe stores it) to sRGB [0-255], clamped. */
function labD50ToSrgb([L, a, b]) {
  const fy = (L + 16) / 116;
  const fx = fy + a / 500;
  const fz = fy - b / 200;
  const inv = (t) => (t ** 3 > 216 / 24389 ? t ** 3 : (116 * t - 16) / (24389 / 27));
  const x = 0.96422 * inv(fx);
  const y = 1 * inv(fy);
  const z = 0.82521 * inv(fz);
  // XYZ D50 to linear sRGB (D65), Bradford-adapted matrix.
  const lr = 3.1338561 * x - 1.6168667 * y - 0.4906146 * z;
  const lg = -0.9787684 * x + 1.9161415 * y + 0.033454 * z;
  const lb = 0.0719453 * x - 0.2289914 * y + 1.4052427 * z;
  const gam = (v) => {
    const c = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.max(0, v) ** (1 / 2.4) - 0.055;
    return Math.max(0, Math.min(255, Math.round(c * 255)));
  };
  return [gam(lr), gam(lg), gam(lb)];
}

/**
 * Swatches from an Adobe Swatch Exchange (.ase) file, as exported from
 * Illustrator's Swatches panel. RGB entries are exact. CMYK, Lab, gray and
 * spot entries convert to screen RGB without a color profile, so
 * `approximate` is true when any appear. Throws on anything else.
 * @param {Uint8Array} bytes
 * @returns {{ swatches: string[], approximate: boolean }}
 */
function parseAse(bytes) {
  const fail = () => {
    throw new Error("Not a readable Adobe swatch (.ase) file.");
  };
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const colors = [];
  let approximate = false;
  try {
    if (String.fromCharCode(...bytes.subarray(0, 4)) !== "ASEF") fail();
    const blocks = view.getUint32(8);
    let o = 12;
    for (let n = 0; n < blocks; n++) {
      const type = view.getUint16(o);
      const length = view.getUint32(o + 2);
      const start = o + 6;
      o = start + length;
      if (o > bytes.length) fail();
      if (type !== 0x0001) continue; // group start/end
      let p = start + 2 + view.getUint16(start) * 2;
      const model = String.fromCharCode(...bytes.subarray(p, p + 4));
      p += 4;
      const f = (i) => view.getFloat32(p + i * 4);
      const unit = (v) => Math.max(0, Math.min(255, Math.round(v * 255)));
      let rgb;
      if (model === "RGB ") {
        rgb = [unit(f(0)), unit(f(1)), unit(f(2))];
        p += 12;
      } else if (model === "CMYK") {
        const k = 1 - f(3);
        rgb = [unit((1 - f(0)) * k), unit((1 - f(1)) * k), unit((1 - f(2)) * k)];
        approximate = true;
        p += 16;
      } else if (model === "LAB ") {
        rgb = labD50ToSrgb([f(0) * 100, f(1), f(2)]);
        approximate = true;
        p += 12;
      } else if (model === "Gray") {
        rgb = [unit(f(0)), unit(f(0)), unit(f(0))];
        approximate = true;
        p += 4;
      } else {
        fail();
      }
      if (p + 2 > o) fail();
      if (view.getUint16(p) === 1) approximate = true; // spot color
      colors.push(toHexColor(rgb));
    }
  } catch (err) {
    if (err instanceof RangeError) fail();
    throw err;
  }
  return { swatches: [...new Set(colors)].slice(0, SWATCHES_MAX), approximate };
}

/** Parse "#RRGGBB" or "RRGGBB" into [r, g, b], or null. */
function parseHexColor(value) {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(String(value).trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

/** Format [r, g, b] as "#RRGGBB". */
function toHexColor([r, g, b]) {
  return "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0").toUpperCase()).join("");
}

function sampleRasterColor(imageData, normalizedX, normalizedY) {
  if (!imageData?.width || !imageData?.height || !imageData.data) return null;
  const x = Math.min(imageData.width - 1, Math.max(0, Math.floor(normalizedX * imageData.width)));
  const y = Math.min(imageData.height - 1, Math.max(0, Math.floor(normalizedY * imageData.height)));
  const offset = (y * imageData.width + x) * 4;
  return [imageData.data[offset], imageData.data[offset + 1], imageData.data[offset + 2]];
}

/**
 * sRGB [0-255] channels to Oklab [L, a, b]. Oklab is perceptually
 * uniform: Euclidean distances here track how different two colors look,
 * unlike raw sRGB where dark and saturated regions are over-weighted.
 */
let SRGB_LINEAR;
function linearLut() {
  if (!SRGB_LINEAR) {
    SRGB_LINEAR = new Float64Array(256);
    for (let i = 0; i < 256; i++) {
      const v = i / 255;
      SRGB_LINEAR[i] = v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    }
  }
  return SRGB_LINEAR;
}

/** @param {number[]} rgb */
function srgbToOklab([r, g, b]) {
  const lut = linearLut();
  const lr = lut[r];
  const lg = lut[g];
  const lb = lut[b];
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/** Oklab [L, a, b] back to sRGB [0-255], clamped and rounded. */
function oklabToSrgb([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lr = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const lb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  const gam = (v) => {
    const c = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.max(0, v) ** (1 / 2.4) - 0.055;
    return Math.max(0, Math.min(255, Math.round(c * 255)));
  };
  return [gam(lr), gam(lg), gam(lb)];
}

/**
 * Dominant border color, or null when the border is mostly transparent.
 * Samples the border ring plus 4x4 corner patches and bins samples
 * coarsely (16 levels per channel), returning the average color of the
 * dominant bin: single corner pixels are one JPEG artifact or watermark
 * away from the wrong answer, and binning absorbs compression noise.
 */
function detectBackgroundColor(img) {
  const { data, width, height } = img;
  const samples = [];
  let total = 0;
  const take = (x, y) => {
    total += 1;
    const i = (y * width + x) * 4;
    if (data[i + 3] >= ALPHA_THRESHOLD) samples.push(i);
  };
  const stride = Math.max(1, Math.floor((2 * (width + height)) / 2048));
  for (let x = 0; x < width; x += stride) {
    take(x, 0);
    take(x, height - 1);
  }
  for (let y = 1; y < height - 1; y += stride) {
    take(0, y);
    take(width - 1, y);
  }
  const k = Math.min(4, width, height);
  for (const [cx, cy] of [
    [0, 0],
    [width - k, 0],
    [0, height - k],
    [width - k, height - k],
  ]) {
    for (let y = cy; y < cy + k; y++) {
      for (let x = cx; x < cx + k; x++) take(x, y);
    }
  }
  // Mostly transparent border: any opaque border pixels are subject, not
  // background.
  if (samples.length < total / 2) return null;

  const bin = (i) => ((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4);
  const bins = new Map();
  let bestKey = -1;
  let bestCount = 0;
  for (const i of samples) {
    const key = bin(i);
    const n = (bins.get(key) || 0) + 1;
    bins.set(key, n);
    if (n > bestCount) {
      bestCount = n;
      bestKey = key;
    }
  }
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (const i of samples) {
    if (bin(i) !== bestKey) continue;
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    n += 1;
  }
  return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
}

/**
 * Write the Oklab coordinates of an sRGB color into `out` (length 3).
 * Allocation-free for per-pixel use; same math as srgbToOklab.
 */
function oklabInto(lut, r, g, b, out) {
  const lr = lut[r];
  const lg = lut[g];
  const lb = lut[b];
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  out[0] = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  out[1] = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  out[2] = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
}

/** Fuzz-scale distance between two Oklab colors (see makeFuzzMatch). */
function fuzzDistance(a, b) {
  const dL = a[0] - b[0];
  const dA = (a[1] - b[1]) * 2;
  const dB = (a[2] - b[2]) * 2;
  return Math.sqrt(dL * dL + dA * dA + dB * dB) * 255;
}

/**
 * Perceptual fuzz matcher: chroma-weighted Oklab distance to `target`,
 * scaled so 0-255 fuzz values stay comparable to the old per-channel
 * scale. Doubling the a/b (chroma) axes keeps hue shifts (subject edges)
 * protected while letting pure lightness noise (shadows, JPEG artifacts)
 * count as background. Allocation-free per call: runs per pixel, and
 * remembers the last color, since flat art repeats it along whole runs.
 */
function makeFuzzMatch(target, fuzz) {
  const [L1, A1, B1] = srgbToOklab(target);
  const lut = linearLut();
  let lastKey = -1;
  let lastResult = false;
  return (r, g, b) => {
    const key = (r << 16) | (g << 8) | b;
    if (key === lastKey) return lastResult;
    lastKey = key;
    const lr = lut[r];
    const lg = lut[g];
    const lb = lut[b];
    const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
    const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
    const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
    const dL = L1 - (0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s);
    const dA = (A1 - (1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s)) * 2;
    const dB = (B1 - (0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s)) * 2;
    lastResult = Math.sqrt(dL * dL + dA * dA + dB * dB) * 255 <= fuzz;
    return lastResult;
  };
}

/**
 * Set alpha to 0 wherever the image matches color within fuzz
 * (perceptual distance, see makeFuzzMatch). Mutates img in place.
 */
function knockOutColor(img, color, fuzz) {
  const { data } = img;
  const matches = makeFuzzMatch(color, fuzz);
  for (let i = 0; i < data.length; i += 4) {
    if (matches(data[i], data[i + 1], data[i + 2])) data[i + 3] = 0;
  }
  return img;
}

/**
 * Enclosed-area limit in trace pixels: `size` source pixels across,
 * squared at the trace `scale`. The "enclosed" option removes regions
 * between a user-set minimum and maximum, because no fixed limit
 * separates letter counters (small) from same-color subject areas such
 * as a blank screen (large).
 */
function enclosedAreaLimit(size, scale) {
  return Math.max(1, Math.round((size * scale) ** 2));
}

/** Largest-enclosed-area slider value that means "no maximum". */
const ENCLOSED_NO_LIMIT = 512;

/**
 * Gradient flood limits, as multiples of fuzz. A real backdrop gradient
 * changes by a fraction of a unit per pixel; what the step limit must
 * reject is the jump across a subject edge. The drift cap bounds how far
 * a chain of small steps can wander from the seed, so a soft,
 * low-contrast edge cannot carry the fill through the whole subject.
 */
const GRADIENT_STEP_SCALE = 0.5;
const GRADIENT_DRIFT_SCALE = 4;

/**
 * Flood-fill knockout: zero the alpha of every pixel CONNECTED to the
 * image border whose color matches `color` within fuzz (perceptual
 * distance). Pixels of the same color inside the subject stay opaque
 * because they are not connected to the edge, unless `enclosedMinArea` is
 * positive: then enclosed matching regions of at least that many pixels,
 * and at most `enclosedMaxArea` (letter counters, gaps between shapes),
 * are removed too. With
 * `gradient`, the fill spreads by small steps between neighbors instead
 * of matching the seed directly, so vignettes and lit backdrops go too
 * (see GRADIENT_STEP_SCALE); enclosed regions still match the seed.
 * Mutates img in place.
 */
function knockOutConnected(
  img,
  color,
  fuzz,
  enclosedMinArea = 0,
  { gradient = false, enclosedMaxArea = Infinity } = {},
) {
  const { data, width, height } = img;
  const fuzzMatch = makeFuzzMatch(color, fuzz);
  const matches = (i) =>
    data[i + 3] >= ALPHA_THRESHOLD && fuzzMatch(data[i], data[i + 1], data[i + 2]);

  // Gradient mode: a neighbor joins when it is within the step limit of
  // the pixel it was reached from and within the drift cap of the seed.
  const lut = linearLut();
  const seedLab = srgbToOklab(color);
  const fromLab = new Float64Array(3);
  const toLab = new Float64Array(3);
  const stepLimit = fuzz * GRADIENT_STEP_SCALE;
  const driftLimit = fuzz * GRADIENT_DRIFT_SCALE;
  const steps = (from, i) => {
    if (data[i + 3] < ALPHA_THRESHOLD) return false;
    oklabInto(lut, data[i], data[i + 1], data[i + 2], toLab);
    return fuzzDistance(fromLab, toLab) <= stepLimit && fuzzDistance(seedLab, toLab) <= driftLimit;
  };

  const stack = new Uint32Array(width * height);
  let stackSize = 0;
  const take = (p) => {
    data[p * 4 + 3] = 0;
    stack[stackSize++] = p;
  };
  const seedPush = (x, y) => {
    const p = y * width + x;
    if (matches(p * 4)) take(p);
  };
  for (let x = 0; x < width; x++) {
    seedPush(x, 0);
    seedPush(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    seedPush(0, y);
    seedPush(width - 1, y);
  }
  while (stackSize) {
    const p = stack[--stackSize];
    const x = p % width;
    const y = (p / width) | 0;
    if (gradient) {
      // Alpha is already 0 on taken pixels; their color is intact.
      const i = p * 4;
      oklabInto(lut, data[i], data[i + 1], data[i + 2], fromLab);
      for (const q of [
        x > 0 ? p - 1 : -1,
        x < width - 1 ? p + 1 : -1,
        y > 0 ? p - width : -1,
        y < height - 1 ? p + width : -1,
      ]) {
        if (q >= 0 && steps(fromLab, q * 4)) take(q);
      }
    } else {
      if (x > 0) seedPush(x - 1, y);
      if (x < width - 1) seedPush(x + 1, y);
      if (y > 0) seedPush(x, y - 1);
      if (y < height - 1) seedPush(x, y + 1);
    }
  }
  if (enclosedMinArea <= 0) return img;

  // Everything still matching is enclosed. Label each region; the BFS
  // queue doubles as the member list, so a region's pixels sit in
  // stack[0..size) when its search ends.
  const seen = new Uint8Array(width * height);
  for (let start = 0; start < width * height; start++) {
    if (seen[start] || !matches(start * 4)) continue;
    seen[start] = 1;
    stack[0] = start;
    let size = 1;
    for (let head = 0; head < size; head++) {
      const p = stack[head];
      const x = p % width;
      const y = (p / width) | 0;
      for (const q of [
        x > 0 ? p - 1 : -1,
        x < width - 1 ? p + 1 : -1,
        y > 0 ? p - width : -1,
        y < height - 1 ? p + width : -1,
      ]) {
        if (q >= 0 && !seen[q] && matches(q * 4)) {
          seen[q] = 1;
          stack[size++] = q;
        }
      }
    }
    if (size >= enclosedMinArea && size <= enclosedMaxArea) {
      for (let k = 0; k < size; k++) data[stack[k] * 4 + 3] = 0;
    }
  }
  return img;
}

/**
 * Edge knockout seeded by the detected border color (see
 * detectBackgroundColor and knockOutConnected). Returns the seed color,
 * or null when the border is already transparent. Mutates img in place.
 */
function knockOutEdges(
  img,
  fuzz,
  enclosedMinArea = 0,
  { gradient = false, enclosedMaxArea = Infinity } = {},
) {
  const seed = detectBackgroundColor(img);
  if (!seed) return null;
  knockOutConnected(img, seed, fuzz, enclosedMinArea, { gradient, enclosedMaxArea });
  return seed;
}

/**
 * Nearest opaque color in the image to target (max per-channel distance),
 * or null when nothing is within maxDistance. Intended for quantized
 * images, where snapping the knockout color to the palette removes the
 * whole cluster instead of only pixels inside the fuzz radius.
 */
function snapToImageColor(img, [r, g, b], maxDistance) {
  const { data } = img;
  const seen = new Set();
  let best = null;
  let bestDist = Infinity;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < ALPHA_THRESHOLD) continue;
    const key = (data[i] << 16) | (data[i + 1] << 8) | data[i + 2];
    if (seen.has(key)) continue;
    seen.add(key);
    const d = Math.max(Math.abs(data[i] - r), Math.abs(data[i + 1] - g), Math.abs(data[i + 2] - b));
    if (d < bestDist) {
      bestDist = d;
      best = [data[i], data[i + 1], data[i + 2]];
    }
  }
  return bestDist <= maxDistance ? best : null;
}

/**
 * Apply the selected background-removal mode. `transparent` is "edges",
 * "auto", an [r, g, b] color, or null/"" for none. For quantized images
 * the target snaps to the nearest palette color so the whole flat
 * cluster goes; fuzz still applies around the snapped color, because an
 * anti-aliased boundary quantizes into several near-background shades
 * that would otherwise survive as a halo outline around the subject.
 * `contiguous` limits a picked color to regions connected to the border,
 * like edges mode; a positive `enclosedMinArea` then also removes
 * enclosed regions of at least that many pixels and at most
 * `enclosedMaxArea` (edges and contiguous only), and `gradient` lets those modes follow a gradient backdrop (see
 * knockOutConnected). Returns the removed color, or null when nothing
 * was removed.
 */
function removeBackground(
  img,
  transparent,
  fuzz,
  quantized,
  { contiguous = false, enclosedMinArea = 0, enclosedMaxArea = Infinity, gradient = false } = {},
) {
  if (transparent === "edges") {
    return knockOutEdges(img, fuzz, enclosedMinArea, { gradient, enclosedMaxArea });
  }
  let target = null;
  if (transparent === "auto") target = detectBackgroundColor(img);
  else if (Array.isArray(transparent)) target = transparent;
  if (!target) return null;
  let color = target;
  if (quantized) {
    const snapped = snapToImageColor(img, target, Math.max(fuzz, 48));
    if (snapped) color = snapped;
  }
  if (contiguous && Array.isArray(transparent)) {
    knockOutConnected(img, color, fuzz, enclosedMinArea, { gradient, enclosedMaxArea });
  } else {
    knockOutColor(img, color, fuzz);
  }
  return color;
}

/**
 * After a knockout made before quantizing: clear opaque pixels along the
 * cutout that looked more like the background than like the palette
 * color they were quantized to. Those are anti-aliased blends that the
 * knockout's fuzz missed; without a background palette slot to absorb
 * them they would trace as an outline. `original` holds the colors from
 * before quantizing. Grows at most `rings` pixels in from the cutout, and
 * only through reclaimed pixels, so the subject cannot be eaten.
 * Mutates img in place.
 */
function reclaimFringe(img, original, seed, rings) {
  const { data, width, height } = img;
  const lut = linearLut();
  const seedLab = srgbToOklab(seed);
  const was = new Float64Array(3);
  const now = new Float64Array(3);
  for (let ring = 0; ring < rings; ring++) {
    const clear = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const p = y * width + x;
        const i = p * 4;
        if (data[i + 3] < ALPHA_THRESHOLD) continue;
        if (
          !(
            (x > 0 && data[i - 4 + 3] < ALPHA_THRESHOLD) ||
            (x < width - 1 && data[i + 4 + 3] < ALPHA_THRESHOLD) ||
            (y > 0 && data[i - width * 4 + 3] < ALPHA_THRESHOLD) ||
            (y < height - 1 && data[i + width * 4 + 3] < ALPHA_THRESHOLD)
          )
        ) {
          continue;
        }
        oklabInto(lut, original[i], original[i + 1], original[i + 2], was);
        oklabInto(lut, data[i], data[i + 1], data[i + 2], now);
        if (fuzzDistance(was, seedLab) < fuzzDistance(was, now)) clear.push(i);
      }
    }
    if (clear.length === 0) break;
    for (const i of clear) data[i + 3] = 0;
  }
  return img;
}

/** How far reclaimFringe may reach into the subject, in pixels. */
const FRINGE_RINGS = 2;

/**
 * Color reduction (when `colors` < 256) plus background removal, in the
 * order each mode needs. Border-connected modes (edges, contiguous pick)
 * build the mask BEFORE quantizing: a light subject edge that shares the
 * background's palette slot would otherwise let the flood leak into the
 * subject; reclaimFringe then clears the blend fringe the earlier mask
 * leaves. Global color modes quantize first so off-white highlights that
 * collapse into the background's palette slot go with it ("N colors
 * where one is transparent"). `background` holds transparent, fuzz,
 * contiguous and gradient as removeBackground takes them, plus enclosed,
 * enclosedSize and enclosedMaxSize (source pixels across;
 * ENCLOSED_NO_LIMIT for no maximum) and scale (trace pixels per source
 * pixel) for the enclosed-area limits. `flatArt` (the source was
 * detected as flat art) repairs soft edges even when the palette was
 * clustered rather than seeded.
 * Returns the removed color, or null. Mutates img in place.
 * @param {(label: string) => void} [stage] progress reporter
 */
function reduceAndRemoveBackground(img, colors, background, stage = () => {}) {
  const {
    transparent,
    fuzz,
    contiguous = false,
    enclosed = false,
    enclosedSize = DEFAULTS.enclosedSize,
    enclosedMaxSize = DEFAULTS.enclosedMaxSize,
    gradient = false,
    scale = 1,
    swatches = null,
    layerDiff = 0,
    seeds = null,
    keep = null,
    flatArt = false,
  } = background;
  const options = {
    contiguous,
    enclosedMinArea: enclosed ? enclosedAreaLimit(enclosedSize, scale) : 0,
    enclosedMaxArea:
      enclosedMaxSize >= ENCLOSED_NO_LIMIT ? Infinity : enclosedAreaLimit(enclosedMaxSize, scale),
    gradient,
  };
  const custom = Array.isArray(swatches) && swatches.length > 0;
  const quantized = custom || colors < 256;
  const reduce = () => {
    const before = new Uint8ClampedArray(img.data);
    // Soft edges only snap to a wrong third color when the palette is a
    // few flat colors; photo palettes would pay seconds for nothing.
    let flat = custom;
    if (custom) {
      stage("Matching your colors…");
      mapToPalette(img, swatches);
    } else {
      stage(`Reducing to ${colors} colors…`);
      const result = quantize(img, colors, { layerDiff, seeds, keep });
      // Nothing remapped means no dither to clean: lone pixels are detail.
      if (!result) return;
      // Compressed flat art clusters without seeds (Colors set by hand),
      // but its edges blur all the same.
      flat = result === "flat" || flatArt;
    }
    if (flat) unblendEdges(img, before, tracePixels(BLEND_REACH, scale));
    modeFilter(img);
  };
  const connected = transparent === "edges" || (Array.isArray(transparent) && contiguous);
  if (quantized && connected) {
    stage("Removing background…");
    const seed = removeBackground(img, transparent, fuzz, false, options);
    const original = seed ? new Uint8ClampedArray(img.data) : null;
    reduce();
    if (seed && original) reclaimFringe(img, original, seed, FRINGE_RINGS);
    return seed;
  }
  if (quantized) reduce();
  if (!transparent) return null;
  stage("Removing background…");
  return removeBackground(img, transparent, fuzz, quantized, options);
}

/**
 * Speck cleanup after a knockout: clear opaque islands and fill enclosed
 * transparent pinholes smaller than `size` x `size` pixels (the same area
 * rule as the tracer's speckle filter). A pinhole takes the most common
 * opaque color around it, so quantized images keep their palette.
 * Transparent regions touching the border are background, never holes.
 * 4-connected. Mutates img in place.
 */
function removeSpecks(img, size) {
  const maxArea = size * size;
  if (maxArea <= 1) return img;
  const { data, width, height } = img;
  const n = width * height;
  const opaque = (p) => data[p * 4 + 3] >= ALPHA_THRESHOLD;
  const seen = new Uint8Array(n);
  const queue = new Uint32Array(n);
  for (let start = 0; start < n; start++) {
    if (seen[start]) continue;
    const isOpaque = opaque(start);
    seen[start] = 1;
    queue[0] = start;
    let count = 1;
    let touchesBorder = false;
    // Neighbor colors across the region boundary, for pinhole fill.
    const around = new Map();
    for (let head = 0; head < count; head++) {
      const p = queue[head];
      const x = p % width;
      const y = (p / width) | 0;
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) touchesBorder = true;
      for (const q of [
        x > 0 ? p - 1 : -1,
        x < width - 1 ? p + 1 : -1,
        y > 0 ? p - width : -1,
        y < height - 1 ? p + width : -1,
      ]) {
        if (q < 0) continue;
        if (opaque(q) !== isOpaque) {
          if (!isOpaque && count < maxArea) {
            const j = q * 4;
            const key = (data[j] << 16) | (data[j + 1] << 8) | data[j + 2];
            around.set(key, (around.get(key) || 0) + 1);
          }
          continue;
        }
        if (!seen[q]) {
          seen[q] = 1;
          queue[count++] = q;
        }
      }
    }
    if (count >= maxArea) continue;
    if (isOpaque) {
      for (let k = 0; k < count; k++) data[queue[k] * 4 + 3] = 0;
    } else if (!touchesBorder && around.size) {
      let fill = 0;
      let best = -1;
      for (const [key, c] of around) {
        if (c > best) {
          best = c;
          fill = key;
        }
      }
      for (let k = 0; k < count; k++) {
        const i = queue[k] * 4;
        data[i] = (fill >> 16) & 0xff;
        data[i + 1] = (fill >> 8) & 0xff;
        data[i + 2] = fill & 0xff;
        data[i + 3] = 255;
      }
    }
  }
  return img;
}

// unblendEdges: how far (source px) a pixel looks for the two fills a
// soft edge blends, and how close (RGB) a color must sit to the segment
// between two fills to count as their blend.
const BLEND_REACH = 20;
const BLEND_TOLERANCE = 24;
// A pixel this close (RGB) to its fill is solid, not a blend, and a
// pixel weighs at most this many nearby fills as blend ends.
const BLEND_MATCH = 10;
const BLEND_CANDIDATES = 8;
// A fill this close (share of the way) to either end of a blend counts
// as a shade of that end, not a gradient band.
const BLEND_BAND_END = 0.15;

/**
 * Soft-edge repair after color reduction. A blurred or anti-aliased edge
 * between two fills holds blends of them, and snapping each blend to the
 * nearest palette color can land on a third color (a navy and cream blur
 * turns teal), leaving a stripe of it along the edge. Each palette color
 * stands for its fill: the original color most of its pixels had, which
 * My colors swatches can differ from. A pixel whose original color is a
 * blend of two fills found within `reach` pixels, and closer to that
 * blend than to its own fill, takes the palette color of the one its
 * blend leans to, so the edge splits where the mix crosses half. Real
 * outlines (the original matches its fill) and gradient bands (its fill
 * is itself between the two) stay. `original` holds the colors before
 * reduction. Mutates img.
 */
function unblendEdges(img, original, reach) {
  if (reach < 1) return img;
  const { data, width, height } = img;
  const n = width * height;
  // Every step near the pixel, then growing by half: a ray only has to
  // cross the blend band and land on the fill beyond it, and upscaled
  // sources stretch `reach` to dozens of pixels.
  const steps = [];
  for (let step = 1; step <= reach; step = step < 4 ? step + 1 : Math.ceil(step * 1.5)) {
    steps.push(step);
  }
  if (steps.at(-1) !== reach) steps.push(reach);
  const stepCount = steps.length;
  const directions = [1, 0, -1, 0, 0, 1, 0, -1, 1, 1, 1, -1, -1, 1, -1, -1];
  // Pixels by palette index, tallying original colors per index. Flat
  // art repeats each pair along a row, so runs are counted, not pixels.
  const ids = new Int32Array(n);
  const paletteIds = new Map();
  const palette = [];
  const tally = new Map();
  const COLOR = 0x1000000;
  let lastKey = -1;
  let lastId = -1;
  let runPair = -1;
  let runLength = 0;
  for (let p = 0; p < n; p++) {
    const i = p * 4;
    if (data[i + 3] < ALPHA_THRESHOLD) {
      ids[p] = -1;
      continue;
    }
    const key = (data[i] << 16) | (data[i + 1] << 8) | data[i + 2];
    if (key !== lastKey) {
      lastKey = key;
      lastId = paletteIds.get(key) ?? -1;
      if (lastId === -1) {
        lastId = palette.length;
        paletteIds.set(key, lastId);
        palette.push(key);
      }
    }
    ids[p] = lastId;
    const pair = lastId * COLOR + ((original[i] << 16) | (original[i + 1] << 8) | original[i + 2]);
    if (pair === runPair) {
      runLength++;
      continue;
    }
    if (runLength) tally.set(runPair, (tally.get(runPair) || 0) + runLength);
    runPair = pair;
    runLength = 1;
  }
  if (runLength) tally.set(runPair, (tally.get(runPair) || 0) + runLength);
  const fills = new Int32Array(palette.length);
  const fillCounts = new Float64Array(palette.length);
  for (const [pair, count] of tally) {
    const id = Math.floor(pair / COLOR);
    if (count > fillCounts[id]) {
      fillCounts[id] = count;
      fills[id] = pair % COLOR;
    }
  }
  // Solid pixels match their fill: the colors a blend can mix. Blend
  // pixels, whatever color they snapped to, are never ends, and in flat
  // art they are the only pixels left to look at.
  // Squared distances throughout: Math.hypot is slow in WebKit.
  const match2 = BLEND_MATCH * BLEND_MATCH;
  const tolerance2 = BLEND_TOLERANCE * BLEND_TOLERANCE;
  const solid = new Uint8Array(n);
  for (let p = 0; p < n; p++) {
    if (ids[p] === -1) continue;
    const i = p * 4;
    const fill = fills[ids[p]];
    const dr = original[i] - ((fill >> 16) & 0xff);
    const dg = original[i + 1] - ((fill >> 8) & 0xff);
    const db = original[i + 2] - (fill & 0xff);
    if (dr * dr + dg * dg + db * db <= match2) solid[p] = 1;
  }
  // Rays read ids, so writing data as we go cannot feed later pixels.
  const seen = new Int32Array(BLEND_CANDIDATES);
  for (let p = 0; p < n; p++) {
    const own = ids[p];
    if (own === -1 || solid[p]) continue;
    const i = p * 4;
    const or = original[i];
    const og = original[i + 1];
    const ob = original[i + 2];
    const ownFill = fills[own];
    const cr = (ownFill >> 16) & 0xff;
    const cg = (ownFill >> 8) & 0xff;
    const cb = ownFill & 0xff;
    const ownDistance2 = (or - cr) ** 2 + (og - cg) ** 2 + (ob - cb) ** 2;
    const x0 = p % width;
    const y0 = (p - x0) / width;
    let count = 0;
    for (let d = 0; d < 16 && count < BLEND_CANDIDATES; d += 2) {
      const dx = directions[d];
      const dy = directions[d + 1];
      // Indexed: for-of over an array is several times slower in WebKit.
      for (let k = 0; k < stepCount; k++) {
        const step = steps[k];
        const x = x0 + dx * step;
        const y = y0 + dy * step;
        if (x < 0 || y < 0 || x >= width || y >= height) break;
        const q = y * width + x;
        const id = ids[q];
        if (id === -1) break;
        // Keep walking past the first fill: a blend shade the palette
        // picked up can sit between this pixel and the real fill.
        if (!solid[q] || id === own) continue;
        let known = false;
        for (let m = 0; m < count; m++) if (seen[m] === id) known = true;
        if (!known) seen[count++] = id;
        if (count === BLEND_CANDIDATES) break;
      }
    }
    if (count < 2) continue;
    let bestResidual2 = Math.min(ownDistance2, tolerance2);
    let pick = own;
    for (let m = 0; m < count; m++) {
      const a = fills[seen[m]];
      const ar = (a >> 16) & 0xff;
      const ag = (a >> 8) & 0xff;
      const ab = a & 0xff;
      for (let j = m + 1; j < count; j++) {
        const b = fills[seen[j]];
        const dr = ((b >> 16) & 0xff) - ar;
        const dg = ((b >> 8) & 0xff) - ag;
        const db = (b & 0xff) - ab;
        const len2 = dr * dr + dg * dg + db * db;
        if (!len2) continue;
        const t = ((or - ar) * dr + (og - ag) * dg + (ob - ab) * db) / len2;
        if (t < 0 || t > 1) continue;
        const residual2 =
          (or - ar - t * dr) ** 2 + (og - ag - t * dg) ** 2 + (ob - ab - t * db) ** 2;
        if (residual2 >= bestResidual2) continue;
        // The pixel's own fill partway between the two is a gradient
        // band. One next to an end is a blend shade the palette picked up.
        const u = ((cr - ar) * dr + (cg - ag) * dg + (cb - ab) * db) / len2;
        if (
          u >= BLEND_BAND_END &&
          u <= 1 - BLEND_BAND_END &&
          (cr - ar - u * dr) ** 2 + (cg - ag - u * dg) ** 2 + (cb - ab - u * db) ** 2 < tolerance2
        ) {
          continue;
        }
        bestResidual2 = residual2;
        pick = t < 0.5 ? seen[m] : seen[j];
      }
    }
    if (pick === own) continue;
    const color = palette[pick];
    data[i] = (color >> 16) & 0xff;
    data[i + 1] = (color >> 8) & 0xff;
    data[i + 2] = color & 0xff;
  }
  return img;
}

// despeckleColors: a thin region is kept as a line when this share of
// its boundary touches one color; a thin region whose color lies within
// SLIVER_DISTANCE (RGB) of the segment between its two main neighbors is
// a blend sliver left by color reduction.
const LINE_SIDE_SHARE = 0.8;
const SLIVER_DISTANCE = 40;

/**
 * Speck removal on a color-reduced image, in place of the tracer's own
 * filter. The tracer drops every region smaller than `size` x `size`
 * pixels and also every region whose perimeter reaches its area: each
 * line 2 px wide or thinner, however long. Here a small region merges
 * into the color it borders most (or turns transparent when that is
 * transparency), and a thin region goes only when it is a blend sliver
 * between two colors; lines on one color and outlines between two fills
 * stay. Repeats until nothing changes (at most 4 passes), since merged
 * specks can leave new ones. 4-connected, exact colors. Mutates img.
 */
function despeckleColors(img, size) {
  const minArea = size * size;
  if (minArea <= 1) return img;
  const { data, width, height } = img;
  const n = width * height;
  const keys = new Int32Array(n);
  for (let p = 0; p < n; p++) {
    const i = p * 4;
    keys[p] =
      data[i + 3] < ALPHA_THRESHOLD ? -1 : (data[i] << 16) | (data[i + 1] << 8) | data[i + 2];
  }
  const label = new Int32Array(n);
  const queue = new Int32Array(n);
  const neighbors = [0, 0, 0, 0];
  const around = new Map();
  for (let pass = 0; pass < 4; pass++) {
    label.fill(-1);
    /** @type {{ start: number, count: number, thin: boolean }[]} */
    const candidates = [];
    let next = 0;
    let end = 0;
    for (let s = 0; s < n; s++) {
      if (label[s] !== -1) continue;
      const key = keys[s];
      const start = end;
      label[s] = next;
      queue[end++] = s;
      let perimeter = 0;
      for (let head = start; head < end; head++) {
        const p = queue[head];
        const x = p % width;
        let k = 0;
        if (x > 0) neighbors[k++] = p - 1;
        if (x < width - 1) neighbors[k++] = p + 1;
        if (p >= width) neighbors[k++] = p - width;
        if (p + width < n) neighbors[k++] = p + width;
        for (let j = 0; j < k; j++) {
          const q = neighbors[j];
          if (keys[q] !== key) {
            perimeter += 1;
          } else if (label[q] === -1) {
            label[q] = next;
            queue[end++] = q;
          }
        }
      }
      const count = end - start;
      if (key !== -1 && (count < minArea || perimeter >= count)) {
        candidates.push({ start, count, thin: count >= minArea });
      }
      next += 1;
    }
    candidates.sort((a, b) => a.count - b.count);
    let changed = false;
    for (const { start, count, thin } of candidates) {
      const own = keys[queue[start]];
      around.clear();
      let total = 0;
      for (let m = start; m < start + count; m++) {
        const p = queue[m];
        const x = p % width;
        let k = 0;
        if (x > 0) neighbors[k++] = p - 1;
        if (x < width - 1) neighbors[k++] = p + 1;
        if (p >= width) neighbors[k++] = p - width;
        if (p + width < n) neighbors[k++] = p + width;
        for (let j = 0; j < k; j++) {
          const other = keys[neighbors[j]];
          if (other === own) continue;
          around.set(other, (around.get(other) || 0) + 1);
          total += 1;
        }
      }
      if (!total) continue;
      let fill = own;
      let best = 0;
      let second = own;
      let secondBest = 0;
      for (const [other, c] of around) {
        if (c > best) {
          second = fill;
          secondBest = best;
          fill = other;
          best = c;
        } else if (c > secondBest) {
          second = other;
          secondBest = c;
        }
      }
      if (thin) {
        if (best >= total * LINE_SIDE_SHARE) continue; // a line on one color
        if (fill === -1 || second === -1 || secondBest === 0) continue;
        if (!betweenColors(own, fill, second)) continue; // an outline
      }
      changed = true;
      for (let m = start; m < start + count; m++) keys[queue[m]] = fill;
    }
    if (!changed) break;
  }
  for (let p = 0; p < n; p++) {
    const i = p * 4;
    const key = keys[p];
    if (key === -1) {
      data[i + 3] = 0;
      continue;
    }
    data[i] = (key >> 16) & 0xff;
    data[i + 1] = (key >> 8) & 0xff;
    data[i + 2] = key & 0xff;
  }
  return img;
}

/** Whether color `c` lies near the RGB segment from `a` to `b` (blend). */
function betweenColors(c, a, b) {
  const rgb = (key) => [(key >> 16) & 0xff, (key >> 8) & 0xff, key & 0xff];
  const [cr, cg, cb] = rgb(c);
  const [ar, ag, ab] = rgb(a);
  const [br, bg, bb] = rgb(b);
  const dr = br - ar;
  const dg = bg - ag;
  const db = bb - ab;
  const len2 = dr * dr + dg * dg + db * db;
  if (!len2) return false;
  const t = ((cr - ar) * dr + (cg - ag) * dg + (cb - ab) * db) / len2;
  if (t <= 0 || t >= 1) return false;
  return Math.hypot(cr - (ar + t * dr), cg - (ag + t * dg), cb - (ab + t * db)) < SLIVER_DISTANCE;
}

/**
 * Matte choke: peel `passes` one-pixel rings off the opaque region,
 * clearing the alpha of opaque pixels 4-adjacent to transparency. Eats
 * the background-blend fringe left along subject boundaries after a
 * knockout, whatever color the fringe is; thin features shrink by the
 * same amount, so the amount is user-controlled. Mutates img in place.
 */
function erodeAlpha(img, passes) {
  const { data, width, height } = img;
  for (let pass = 0; pass < passes; pass++) {
    const peel = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const p = y * width + x;
        if (data[p * 4 + 3] < ALPHA_THRESHOLD) continue;
        if (
          (x > 0 && data[(p - 1) * 4 + 3] < ALPHA_THRESHOLD) ||
          (x < width - 1 && data[(p + 1) * 4 + 3] < ALPHA_THRESHOLD) ||
          (y > 0 && data[(p - width) * 4 + 3] < ALPHA_THRESHOLD) ||
          (y < height - 1 && data[(p + width) * 4 + 3] < ALPHA_THRESHOLD)
        ) {
          peel.push(p);
        }
      }
    }
    if (peel.length === 0) break;
    for (const p of peel) data[p * 4 + 3] = 0;
  }
  return img;
}

/**
 * Two passes of a separable running-sum box blur with a (2r+1) window,
 * in place. Values past the edges repeat the nearest edge value.
 * @param {Float32Array} values
 */
function boxBlur(values, width, height, radius) {
  const window = 2 * radius + 1;
  // One line at a time, padded by `radius` repeats of each end so the
  // running sum needs no bounds checks (slow in WebKit).
  const line = new Float32Array(Math.max(width, height) + 2 * radius + 1);
  const blur = (length, count, stride, step) => {
    for (let l = 0; l < count; l++) {
      const base = l * stride;
      const first = values[base];
      const last = values[base + (length - 1) * step];
      for (let k = 0; k < radius; k++) line[k] = first;
      for (let i = 0; i < length; i++) line[radius + i] = values[base + i * step];
      for (let k = radius + length; k <= length + 2 * radius; k++) line[k] = last;
      let sum = 0;
      for (let k = 0; k <= 2 * radius; k++) sum += line[k];
      for (let i = 0; i < length; i++) {
        values[base + i * step] = sum / window;
        sum += line[i + 2 * radius + 1] - line[i];
      }
    }
  };
  for (let pass = 0; pass < 2; pass++) {
    blur(width, height, width, 1);
    blur(height, width, 1, width);
  }
}

/**
 * Matte smoothing: box-blur the opaque mask twice with a (2r+1) window and
 * threshold it at half, so bumps and notches narrower than about `radius`
 * flatten while straight edges stay put; corners round by about `radius`
 * and features thinner than it vanish. Pixels outside the image count as
 * their nearest edge pixel, so the canvas border is not eaten. Newly
 * opaque pixels take the color of an adjacent opaque pixel. Mutates img.
 */
function smoothAlpha(img, radius) {
  if (radius <= 0) return img;
  const { data, width, height } = img;
  const n = width * height;
  const mask = new Float32Array(n);
  for (let p = 0; p < n; p++) mask[p] = data[p * 4 + 3] >= ALPHA_THRESHOLD ? 1 : 0;
  boxBlur(mask, width, height, radius);

  /** @type {number[]} newly opaque pixels still waiting for a color */
  let pending = [];
  for (let p = 0; p < n; p++) {
    const was = data[p * 4 + 3] >= ALPHA_THRESHOLD;
    const now = mask[p] >= 0.5;
    if (was && !now) data[p * 4 + 3] = 0;
    else if (!was && now) pending.push(p);
  }
  const colored = new Uint8Array(n);
  for (let p = 0; p < n; p++) colored[p] = data[p * 4 + 3] >= ALPHA_THRESHOLD ? 1 : 0;
  // Grow colors ring by ring into the filled-in pixels.
  while (pending.length) {
    const next = [];
    const filled = [];
    for (const p of pending) {
      const x = p % width;
      const neighbours = [
        x > 0 ? p - 1 : -1,
        x < width - 1 ? p + 1 : -1,
        p >= width ? p - width : -1,
        p < n - width ? p + width : -1,
      ];
      const source = neighbours.find((q) => q >= 0 && colored[q]);
      if (source === undefined) next.push(p);
      else filled.push([p, source]);
    }
    if (!filled.length) break;
    for (const [p, q] of filled) {
      data.copyWithin(p * 4, q * 4, q * 4 + 3);
      data[p * 4 + 3] = 255;
      colored[p] = 1;
    }
    pending = next;
  }
  return img;
}

/**
 * Distance in pixels from each set bit of a mask to the nearest unset bit
 * or the mask's edge (chamfer 3-4, so diagonals cost about √2). Unset
 * bits are 0.
 * @param {Uint8Array} bits
 */
function maskDepth(bits, width, height) {
  const far = 3 * (width + height);
  const depth = new Int32Array(width * height);
  for (let p = 0; p < depth.length; p++) depth[p] = bits[p] ? far : 0;
  const at = (x, y) => (x < 0 || y < 0 || x >= width || y >= height ? 0 : depth[y * width + x]);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      if (!depth[p]) continue;
      depth[p] = Math.min(
        depth[p],
        at(x - 1, y) + 3,
        at(x, y - 1) + 3,
        at(x - 1, y - 1) + 4,
        at(x + 1, y - 1) + 4,
      );
    }
  }
  for (let y = height - 1; y >= 0; y--) {
    for (let x = width - 1; x >= 0; x--) {
      const p = y * width + x;
      if (!depth[p]) continue;
      depth[p] = Math.min(
        depth[p],
        at(x + 1, y) + 3,
        at(x, y + 1) + 3,
        at(x + 1, y + 1) + 4,
        at(x - 1, y + 1) + 4,
      );
    }
  }
  return Float32Array.from(depth, (d) => d / 3);
}

// smoothLabels: colors that take part in a stroke's vote, most common
// first. Reduced images have a handful; an unreduced photo has thousands,
// and its rare shades would only add cost.
const SMOOTH_COLORS = 16;
const SMOOTH_PASSES = 3;

/**
 * Smooth brush: inside each stroke, every pixel takes the color that most
 * of its surroundings have, so bumps, notches and stair steps narrower
 * than about `radius` flatten while longer edges stay put. Each color's
 * mask is box-blurred twice (as smoothAlpha does for the matte) over the
 * stroke's box grown by the blur's reach, the strongest color wins, and
 * the vote repeats SMOOTH_PASSES times.
 * Transparency counts as a color, so erased edges smooth too, and no new
 * colors appear. `regions` hold a stroke's mask in image pixels: { x, y,
 * width, height, bits (1 inside), radius }. Mutates img in place.
 * @param {{ x: number, y: number, width: number, height: number, bits: Uint8Array, radius: number }[]} regions
 */
function smoothLabels(img, regions) {
  const { data, width, height } = img;
  for (const region of regions) {
    const radius = Math.max(1, Math.round(region.radius));
    const reach = 2 * radius;
    const x0 = Math.max(0, region.x - reach);
    const y0 = Math.max(0, region.y - reach);
    const x1 = Math.min(width, region.x + region.width + reach);
    const y1 = Math.min(height, region.y + region.height + reach);
    const boxWidth = x1 - x0;
    const boxHeight = y1 - y0;
    if (boxWidth <= 0 || boxHeight <= 0) continue;
    const area = boxWidth * boxHeight;
    const depth = maskDepth(region.bits, region.width, region.height);
    const keys = new Int32Array(area);
    const best = new Float32Array(area);
    const winner = new Int32Array(area);
    const own = new Float32Array(area);
    const weight = new Float32Array(area);
    // One vote moves edges but keeps each color's area, so a notch only
    // spreads into a shallow dip; repeating it flattens the dip, as
    // curvature flow does.
    for (let pass = 0; pass < SMOOTH_PASSES; pass++) {
      // Color key per box pixel; -1 is transparent.
      const counts = new Map();
      for (let y = 0; y < boxHeight; y++) {
        for (let x = 0; x < boxWidth; x++) {
          const i = ((y + y0) * width + x + x0) * 4;
          const key =
            data[i + 3] < ALPHA_THRESHOLD ? -1 : (data[i] << 16) | (data[i + 1] << 8) | data[i + 2];
          keys[y * boxWidth + x] = key;
          counts.set(key, (counts.get(key) || 0) + 1);
        }
      }
      const colors = [...counts]
        .sort((a, b) => b[1] - a[1])
        .slice(0, SMOOTH_COLORS)
        .map(([key]) => key);
      if (colors.length < 2) break;
      best.fill(-1);
      own.fill(0);
      for (const key of colors) {
        for (let p = 0; p < area; p++) weight[p] = keys[p] === key ? 1 : 0;
        boxBlur(weight, boxWidth, boxHeight, radius);
        for (let p = 0; p < area; p++) {
          if (keys[p] === key) own[p] = weight[p];
          if (weight[p] > best[p]) {
            best[p] = weight[p];
            winner[p] = key;
          }
        }
      }
      for (let y = 0; y < region.height; y++) {
        const by = y + region.y - y0;
        if (by < 0 || by >= boxHeight) continue;
        for (let x = 0; x < region.width; x++) {
          const bx = x + region.x - x0;
          if (bx < 0 || bx >= boxWidth || !region.bits[y * region.width + x]) continue;
          const p = by * boxWidth + bx;
          const key = winner[p];
          if (key === keys[p]) continue;
          // Fade in from the stroke's edge, so the edges it moves meet
          // the untouched ones outside without a step.
          const strength = Math.min(1, depth[y * region.width + x] / radius);
          if (strength * best[p] <= strength * own[p] + (1 - strength)) continue;
          const i = ((by + y0) * width + bx + x0) * 4;
          if (key === -1) {
            data[i + 3] = 0;
          } else {
            data[i] = (key >> 16) & 0xff;
            data[i + 1] = (key >> 8) & 0xff;
            data[i + 2] = key & 0xff;
            data[i + 3] = 255;
          }
        }
      }
    }
  }
  return img;
}

/**
 * Matte defringe: recolor the outermost `depth` rings of the opaque
 * region from the colors one ring deeper, hiding background-blend fringe
 * without shrinking the shape. Complements erodeAlpha: trim deletes
 * boundary pixels (thin features shrink), defringe repaints them. Rings
 * are processed from the innermost fringe ring outward so interior colors
 * propagate to the edge; pixels with no deeper neighbor (features thinner
 * than 2*depth) keep their original color. With `keepPalette` a fringe
 * pixel takes the most common deeper color instead of their average, so a
 * color-reduced image gains no new colors. Mutates img in place.
 */
function defringeAlpha(img, depth, { keepPalette = false } = {}) {
  if (depth <= 0) return img;
  const { data, width, height } = img;
  const n = width * height;
  // BFS distance from transparency: 0 transparent, d for the d-th opaque
  // ring, -1 for opaque pixels deeper than `depth` (clean interior).
  const dist = new Int32Array(n).fill(-1);
  let queue = [];
  for (let p = 0; p < n; p++) {
    if (data[p * 4 + 3] < ALPHA_THRESHOLD) {
      dist[p] = 0;
      queue.push(p);
    }
  }
  if (queue.length === 0 || queue.length === n) return img;
  const rings = [];
  for (let d = 1; d <= depth && queue.length; d++) {
    const next = [];
    for (const p of queue) {
      const x = p % width;
      const y = (p / width) | 0;
      const grow = (q) => {
        if (dist[q] === -1) {
          dist[q] = d;
          next.push(q);
        }
      };
      if (x > 0) grow(p - 1);
      if (x < width - 1) grow(p + 1);
      if (y > 0) grow(p - width);
      if (y < height - 1) grow(p + width);
    }
    rings.push(next);
    queue = next;
  }

  for (let d = rings.length; d >= 1; d--) {
    for (const p of rings[d - 1]) {
      const x = p % width;
      const y = (p / width) | 0;
      let r = 0;
      let g = 0;
      let b = 0;
      let count = 0;
      /** @type {Map<number, number>} deeper colors by vote, for keepPalette */
      const votes = new Map();
      let winner = -1;
      for (let dy = -1; dy <= 1; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= width) continue;
          const q = ny * width + nx;
          // Pull only from deeper rings (already repainted) or interior.
          if (q === p || (dist[q] !== -1 && dist[q] <= d)) continue;
          const j = q * 4;
          r += data[j];
          g += data[j + 1];
          b += data[j + 2];
          count += 1;
          if (keepPalette) {
            const key = (data[j] << 16) | (data[j + 1] << 8) | data[j + 2];
            const tally = (votes.get(key) ?? 0) + 1;
            votes.set(key, tally);
            if (winner < 0 || tally > (votes.get(winner) ?? 0)) winner = key;
          }
        }
      }
      if (count > 0) {
        const j = p * 4;
        if (keepPalette) {
          data[j] = (winner >> 16) & 0xff;
          data[j + 1] = (winner >> 8) & 0xff;
          data[j + 2] = winner & 0xff;
        } else {
          data[j] = r / count;
          data[j + 1] = g / count;
          data[j + 2] = b / count;
        }
      }
    }
  }
  return img;
}

/**
 * Threshold alpha to 0 or 255 so anti-aliased edge fringe cannot fragment
 * the trace into junk paths. Mutates img in place.
 */
function binarizeAlpha(img) {
  const { data } = img;
  for (let i = 3; i < data.length; i += 4) {
    data[i] = data[i] >= ALPHA_THRESHOLD ? 255 : 0;
  }
  return img;
}

/** Luminance (Rec. 601) grayscale conversion, alpha preserved. In place. */
function toGrayscale(img) {
  const { data } = img;
  for (let i = 0; i < data.length; i += 4) {
    const l = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    data[i] = data[i + 1] = data[i + 2] = l;
  }
  return img;
}

/** Most common opaque color, sampled with a stride for speed. */
function dominantOpaqueColor(img) {
  const { data } = img;
  const pixelCount = data.length / 4;
  const stride = Math.max(1, Math.floor(pixelCount / 4096)) * 4;
  const counts = new Map();
  let best = null;
  let bestCount = 0;
  for (let i = 0; i < data.length; i += stride) {
    if (data[i + 3] < ALPHA_THRESHOLD) continue;
    const key = (data[i] << 16) | (data[i + 1] << 8) | data[i + 2];
    const n = (counts.get(key) || 0) + 1;
    counts.set(key, n);
    if (n > bestCount) {
      bestCount = n;
      best = key;
    }
  }

  if (best === null) return [255, 255, 255];
  return [(best >> 16) & 0xff, (best >> 8) & 0xff, best & 0xff];
}

/**
 * Convert an RGB color with the same luma calculation as toGrayscale.
 * @param {[number, number, number]} color
 * @returns {[number, number, number]}
 */
function toGrayscaleColor([r, g, b]) {
  const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  return [gray, gray, gray];
}

// Solid color thresholds for analyzeFlatness. The two shares are of all
// opaque samples; the interior share is of the color's own samples.
// Measured on anti-aliased flat art: real colors have 29% or more interior
// pixels (thin lines included), edge blends 6% or fewer.
const SOLID_MIN_SHARE = 0.001;
const SOLID_LINE_SHARE = 0.01;
const SOLID_MIN_INTERIOR = 0.2;
// Exact solid colors must cover this share of samples to be trusted;
// below it (JPEG, resampling, noise) similarFlatness clusters instead.
// Clean flat PNGs measure 0.979 or more, compressed or resampled 0.967 or less.
const EXACT_SOLID_SHARE = 0.975;
// similarFlatness: least neighbor tolerance (sum of RGB differences),
// least share of samples inside areas, Oklab cluster radius, widest mean
// cluster spread (gradients measure 0.0085, compressed flat art 0.0054 or
// less), and the share that makes a color a thin line.
const SIMILAR_MIN_TOLERANCE = 24;
const SIMILAR_MIN_INSIDE = 0.5;
const SIMILAR_CLUSTER_DISTANCE = 0.03;
const SIMILAR_MAX_SPREAD = 0.007;
const SIMILAR_LINE_SHARE = 0.02;

/**
 * Coverage-based flatness heuristic. Flat-color sources (logos, text,
 * screenshots, pixel art) concentrate almost all pixels in a handful of
 * colors even when anti-aliasing adds thousands of rare fringe colors, so
 * coverage is tested before unique counts: flat when the 16 most common
 * sampled colors cover >= 90% of opaque samples. Exact sampled images below
 * 256 colors are also flat, and noisy flat art can still pass when its
 * colors collapse into a few dominant RGB clusters. Clustered art starts with
 * a less aggressive color budget so distressed details survive.
 * Transparent pixels are ignored; a fully
 * transparent image is not flat.
 *
 * Flat results also list `solids`, the colors of the artwork as [r, g, b]:
 * every color with at least SOLID_MIN_SHARE of the samples that either
 * fills areas (some samples have all four neighbors the same color) or is
 * common enough to be a thin line. Anti-alias blends sit only on edges,
 * so they rarely have interior pixels. colorCount counts the solids, so
 * small accents past 95% coverage still get a palette slot.
 */
function analyzeFlatness(img) {
  const { solidShare, ...exact } = exactFlatness(img);
  if (exact.solids && solidShare >= EXACT_SOLID_SHARE) return exact;
  return similarFlatness(img) ?? exact;
}

// withoutBlendShades: how close (RGB) a color must sit to the segment
// between two fills to count as their mix, and how far along it (share
// of the way from either end) it must be.
const SHADE_TOLERANCE = 24;
const SHADE_END = 0.08;
// A real color fills areas: this share of its pixels have neighbors all
// within the image's noise of their own color. Blur shades change from
// pixel to pixel across an edge, and anti-alias shades are lines a pixel
// or two wide. Measured: real sample colors 0.27 or more, blur and
// anti-alias shades 0.09 or less.
const SHADE_MIN_INTERIOR = 0.2;

/**
 * Detected colors without the shades a soft edge leaves between two
 * fills. Blurred or resampled flat art grows bands of every mix of the
 * two colors along each edge, and the common ones pass for colors. A
 * color that is a mix of two other detected colors is dropped when its
 * pixels rarely fill areas. `solids` are ordered most common first; the
 * least common are tested first and only kept colors serve as ends.
 */
function withoutBlendShades(img, solids) {
  if (solids.length < 3) return solids;
  const { data, width } = img;
  const pixelCount = data.length / 4;
  const height = pixelCount / width;
  let stride = Math.max(1, Math.ceil(pixelCount / 200_000));
  if (stride % 2 === 0) stride += 1;
  const row = width * 4;
  const step = (i, j) =>
    Math.abs(data[i] - data[j]) +
    Math.abs(data[i + 1] - data[j + 1]) +
    Math.abs(data[i + 2] - data[j + 2]);
  // Noise level as similarFlatness measures it, for the interior test.
  const steps = [];
  for (let p = 0; p < pixelCount; p += stride * 7) {
    if (p % width < width - 1 && data[p * 4 + 3] >= ALPHA_THRESHOLD) {
      steps.push(step(p * 4, p * 4 + 4));
    }
  }
  steps.sort((a, b) => a - b);
  const flatStep = Math.max(6, 2 * (steps[steps.length >> 1] ?? 0));
  const tolerance2 = SHADE_TOLERANCE * SHADE_TOLERANCE;
  const along = (c, a, b) => {
    const dr = b[0] - a[0];
    const dg = b[1] - a[1];
    const db = b[2] - a[2];
    const len2 = dr * dr + dg * dg + db * db;
    if (!len2) return null;
    const t = ((c[0] - a[0]) * dr + (c[1] - a[1]) * dg + (c[2] - a[2]) * db) / len2;
    const residual2 =
      (c[0] - a[0] - t * dr) ** 2 + (c[1] - a[1] - t * dg) ** 2 + (c[2] - a[2] - t * db) ** 2;
    return { t, residual2 };
  };
  const nearest = (i, colors) => {
    let best = -1;
    let bestDistance = Infinity;
    for (let k = 0; k < colors.length; k++) {
      const c = colors[k];
      const d = (data[i] - c[0]) ** 2 + (data[i + 1] - c[1]) ** 2 + (data[i + 2] - c[2]) ** 2;
      if (d < bestDistance) {
        bestDistance = d;
        best = k;
      }
    }
    return best;
  };
  // Share of the color's pixels whose four neighbors match their own.
  const interiorShare = (colors, k) => {
    let count = 0;
    let interior = 0;
    for (let p = 0; p < pixelCount; p += stride) {
      const i = p * 4;
      if (data[i + 3] < ALPHA_THRESHOLD || nearest(i, colors) !== k) continue;
      count += 1;
      const x = p % width;
      const y = (p - x) / width;
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) continue;
      if (
        step(i, i - 4) <= flatStep &&
        step(i, i + 4) <= flatStep &&
        step(i, i - row) <= flatStep &&
        step(i, i + row) <= flatStep
      ) {
        interior += 1;
      }
    }
    return count ? interior / count : 0;
  };
  const kept = [...solids];
  for (let k = kept.length - 1; k >= 2; k--) {
    const color = kept[k];
    const ends = kept.filter((_, j) => j !== k);
    let shade = false;
    for (let m = 0; m < ends.length && !shade; m++) {
      for (let j = m + 1; j < ends.length && !shade; j++) {
        const fit = along(color, ends[m], ends[j]);
        if (!fit || fit.residual2 > tolerance2) continue;
        if (fit.t < SHADE_END || fit.t > 1 - SHADE_END) continue;
        shade = interiorShare(kept, k) < SHADE_MIN_INTERIOR;
      }
    }
    if (shade) kept.splice(k, 1);
  }
  return kept;
}

/**
 * Solid colors of flat art whose colors are not exact: JPEG compression,
 * resampling or light noise spread each flat color over many near
 * shades. A sample is inside an area when its four neighbors are within
 * a tolerance that follows the image's own noise level (anti-alias
 * blends sit between colors that differ sharply, so they drop out), and
 * those samples are grouped into perceptual (Oklab) clusters. Returns
 * null when the clusters do not describe flat art: too many, too wide
 * (smooth gradients), or too little of the image inside areas (photos).
 */
function similarFlatness(img) {
  const { data, width } = img;
  const pixelCount = data.length / 4;
  const height = pixelCount / width;
  let stride = Math.max(1, Math.ceil(pixelCount / 200_000));
  if (stride % 2 === 0) stride += 1;
  const distance = (i, j) =>
    Math.abs(data[i] - data[j]) +
    Math.abs(data[i + 1] - data[j + 1]) +
    Math.abs(data[i + 2] - data[j + 2]);
  // Noise level: the median difference to the right-hand neighbor, which
  // flat areas dominate in flat art.
  const steps = [];
  for (let p = 0; p < pixelCount; p += stride * 7) {
    if (p % width < width - 1) steps.push(distance(p * 4, p * 4 + 4));
  }
  steps.sort((a, b) => a - b);
  const tolerance = Math.max(SIMILAR_MIN_TOLERANCE, 3 * (steps[steps.length >> 1] ?? 0));

  // 5-bit bins hold running sums so each cluster gets its mean color.
  const bin = (bins, i) => {
    const key = ((data[i] >> 3) << 10) | ((data[i + 1] >> 3) << 5) | (data[i + 2] >> 3);
    let entry = bins.get(key);
    if (!entry) bins.set(key, (entry = [0, 0, 0, 0]));
    entry[0] += data[i];
    entry[1] += data[i + 1];
    entry[2] += data[i + 2];
    entry[3] += 1;
  };
  const inside = new Map();
  const everywhere = new Map();
  const row = width * 4;
  let opaque = 0;
  let insideCount = 0;
  for (let p = 0; p < pixelCount; p += stride) {
    const i = p * 4;
    if (data[i + 3] < ALPHA_THRESHOLD) continue;
    opaque += 1;
    bin(everywhere, i);
    const x = p % width;
    const y = (p - x) / width;
    if (x === 0 || y === 0 || x === width - 1 || y === height - 1) continue;
    if (
      distance(i, i - 4) > tolerance ||
      distance(i, i + 4) > tolerance ||
      distance(i, i - row) > tolerance ||
      distance(i, i + row) > tolerance
    ) {
      continue;
    }
    insideCount += 1;
    bin(inside, i);
  }
  if (opaque === 0 || insideCount < opaque * SIMILAR_MIN_INSIDE) return null;

  // Greedy by frequency: a bin joins the nearest cluster seed within
  // SIMILAR_CLUSTER_DISTANCE, else seeds a cluster of its own.
  const cluster = (bins) => {
    const clusters = [];
    for (const [r, g, b, count] of [...bins.values()].sort((x, y) => y[3] - x[3])) {
      const lab = srgbToOklab([
        Math.round(r / count),
        Math.round(g / count),
        Math.round(b / count),
      ]);
      let best = null;
      let bestDistance = SIMILAR_CLUSTER_DISTANCE;
      for (const c of clusters) {
        const d = Math.hypot(c.lab[0] - lab[0], c.lab[1] - lab[1], c.lab[2] - lab[2]);
        if (d < bestDistance) {
          bestDistance = d;
          best = c;
        }
      }
      if (best) {
        best.sum[0] += r;
        best.sum[1] += g;
        best.sum[2] += b;
        best.count += count;
        best.spread += bestDistance * count;
      } else {
        clusters.push({ lab, sum: [r, g, b], count, spread: 0 });
      }
    }
    return clusters;
  };
  const areas = cluster(inside);
  const solidClusters = areas.filter((c) => c.count >= opaque * SOLID_MIN_SHARE);
  const covered = solidClusters.reduce((sum, c) => sum + c.count, 0);
  const spread = areas.reduce((sum, c) => sum + c.spread, 0) / insideCount;
  if (covered < insideCount * 0.9 || spread >= SIMILAR_MAX_SPREAD) return null;
  // Thin lines have no inside samples: a common color anywhere that is
  // not near an area color still counts.
  const near = (a, b) =>
    Math.hypot(a.lab[0] - b.lab[0], a.lab[1] - b.lab[1], a.lab[2] - b.lab[2]) <
    SIMILAR_CLUSTER_DISTANCE;
  for (const c of cluster(everywhere)) {
    if (c.count >= opaque * SIMILAR_LINE_SHARE && !solidClusters.some((s) => near(s, c))) {
      solidClusters.push(c);
    }
  }
  if (solidClusters.length > 32) return null;
  const solids = withoutBlendShades(
    img,
    solidClusters
      .sort((a, b) => b.count - a.count)
      .map((c) => c.sum.map((v) => Math.round(v / c.count))),
  );
  return { flat: true, colorCount: Math.max(2, solids.length), solids };
}

/**
 * analyzeFlatness on exact colors (described above), plus `solidShare`:
 * the share of samples whose exact color is one of the solids.
 */
function exactFlatness(img) {
  const { data, width } = img;
  const pixelCount = data.length / 4;
  const height = pixelCount / width;
  const keyAt = (i) => (data[i] << 16) | (data[i + 1] << 8) | data[i + 2];
  // Odd pixel stride so sampling does not lock to even image widths and
  // hit the same columns every row.
  let stride = Math.max(1, Math.ceil(pixelCount / 200_000));
  if (stride % 2 === 0) stride += 1;
  const counts = new Map();
  const interior = new Map();
  let total = 0;
  for (let p = 0; p < pixelCount; p += stride) {
    const i = p * 4;
    if (data[i + 3] < ALPHA_THRESHOLD) continue;
    const key = keyAt(i);
    counts.set(key, (counts.get(key) || 0) + 1);
    total += 1;
    const x = p % width;
    const y = (p - x) / width;
    if (
      x > 0 &&
      x < width - 1 &&
      y > 0 &&
      y < height - 1 &&
      keyAt(i - 4) === key &&
      keyAt(i + 4) === key &&
      keyAt(i - width * 4) === key &&
      keyAt(i + width * 4) === key
    ) {
      interior.set(key, (interior.get(key) || 0) + 1);
    }
  }
  if (total === 0) return { flat: false, colorCount: 256 };
  const sorted = [...counts.values()].sort((a, b) => b - a);
  let covered = 0;
  let topCoverage = 0;
  let colorCount = sorted.length;
  let counted = false;
  for (let i = 0; i < sorted.length; i++) {
    covered += sorted[i];
    if (i < 16) topCoverage = covered / total;
    if (!counted && covered / total >= 0.95) {
      colorCount = i + 1;
      counted = true;
    }
    if (counted && i >= 16) break;
  }
  const toRgb = (key) => [(key >> 16) & 0xff, (key >> 8) & 0xff, key & 0xff];
  if (counts.size <= 32 && topCoverage < 0.9) {
    return {
      flat: true,
      colorCount: Math.max(2, counts.size),
      solids: [...counts.keys()].map(toRgb),
      solidShare: 1,
    };
  }
  if (topCoverage < 0.9) {
    const clusters = new Map();
    for (const [key, count] of counts) {
      const r = (key >> 16) & 0xff;
      const g = (key >> 8) & 0xff;
      const b = key & 0xff;
      const clusterKey = ((r >> 6) << 4) | ((g >> 6) << 2) | (b >> 6);
      clusters.set(clusterKey, (clusters.get(clusterKey) || 0) + count);
    }
    const clusterCounts = [...clusters.values()].sort((a, b) => b - a);
    let clusterCovered = 0;
    let clusterColorCount = clusterCounts.length;
    for (let i = 0; i < Math.min(8, clusterCounts.length); i++) {
      clusterCovered += clusterCounts[i];
      if (clusterCovered / total >= 0.95) {
        clusterColorCount = i + 1;
        break;
      }
    }
    if (clusterCovered / total >= 0.9 && clusterCounts[0] / total >= 0.35) {
      return { flat: true, colorCount: Math.min(32, Math.max(8, clusterColorCount * 2)) };
    }
  }
  if (topCoverage < 0.9) return { flat: false, colorCount: Math.min(32, Math.max(2, colorCount)) };
  const kept = [...counts]
    .filter(([key, count]) => {
      const share = count / total;
      if (share < SOLID_MIN_SHARE) return false;
      return share >= SOLID_LINE_SHARE || (interior.get(key) || 0) / count >= SOLID_MIN_INTERIOR;
    })
    .sort((a, b) => b[1] - a[1])
    .slice(0, 32);
  const solidShare = kept.reduce((sum, [, count]) => sum + count, 0) / total;
  const solids = withoutBlendShades(
    img,
    kept.map(([key]) => toRgb(key)),
  );
  return { flat: true, colorCount: Math.max(2, solids.length), solids, solidShare };
}

/**
 * Snap every opaque pixel to the nearest of `swatches` ("#RRGGBB") in
 * Oklab: a fixed palette (brand colors, stocked inks) in place of
 * quantize's automatic one. Transparent pixels get the dominant opaque
 * color's swatch, as quantize backfills them. Mutates img in place.
 */
function mapToPalette(img, swatches) {
  const palette = swatches.map((hex) => {
    const rgb = /** @type {[number, number, number]} */ (parseHexColor(hex));
    return { rgb, lab: srgbToOklab(rgb) };
  });
  /** @type {Map<number, [number, number, number]>} */
  const nearest = new Map();
  const snap = (r, g, b) => {
    const key = (r << 16) | (g << 8) | b;
    let hit = nearest.get(key);
    if (!hit) {
      const [L, A, B] = srgbToOklab([r, g, b]);
      let best = Infinity;
      for (const { rgb, lab } of palette) {
        const d = (L - lab[0]) ** 2 + (A - lab[1]) ** 2 + (B - lab[2]) ** 2;
        if (d < best) {
          best = d;
          hit = rgb;
        }
      }
      nearest.set(key, hit);
    }
    return hit;
  };
  const { data } = img;
  const dominant = dominantOpaqueColor(img);
  const backfill = dominant ? snap(dominant[0], dominant[1], dominant[2]) : palette[0].rgb;
  for (let i = 0; i < data.length; i += 4) {
    const rgb = data[i + 3] < ALPHA_THRESHOLD ? backfill : snap(data[i], data[i + 1], data[i + 2]);
    data[i] = rgb[0];
    data[i + 1] = rgb[1];
    data[i + 2] = rgb[2];
  }
  return img;
}

// Quantize clusters colors at 6 bits per channel: a 4 MP photo carries
// around two million unique colors, which made median cut and k-means
// take tens of seconds. Bins 4 levels wide are invisible after reducing
// to at most 128 colors, and cap the work at 2^18 entries.
const QUANT_SHIFT = 2;
const QUANT_BITS = 8 - QUANT_SHIFT;
// Share of opaque pixels the most common colors must cover to seed quantize.
const FLAT_SEED_COVERAGE = 0.9;
// Oklab distance under which a common color is a near-duplicate seed: about
// one quantize bin, so resampling blends next to a solid color merge with it.
const FLAT_SEED_MIN_DISTANCE = 0.015;
// Least share of opaque pixels a flat color needs to take a palette slot.
const FLAT_SEED_MIN_SHARE = 0.001;
// Flat art seeding is for small palettes: auto-detect caps flat art at 32.
const FLAT_SEED_MAX_COLORS = 32;

/**
 * Median-cut color quantization to at most `colors` colors, refined with
 * k-means in Oklab. Flat art, where the `colors` most common colors cover
 * almost every pixel, keeps exactly those colors instead. Images that
 * already have at most `colors` exact colors are left untouched. A flat
 * color within `layerDiff` (the tracer's Merge) of a more common one gets
 * no slot, since the tracer would merge it away. `seeds` ([r, g, b], at
 * most `colors` used) replace that search when auto-detect already found
 * the art's colors, as compressed sources have no exact colors to seed
 * from. The palette comes from
 * opaque pixels only: hidden pixels carry garbage colors, and counting a
 * large knocked-out area as any one color would crowd small visible
 * details out of the palette. Transparent pixels are then painted with the dominant opaque
 * color's palette entry; alpha is untouched. `keep` ([r, g, b], painted
 * fill colors) join the palette exactly, on top of `colors`. Mutates img
 * in place and returns false when it remapped nothing, "flat" when the
 * palette is the art's own flat colors (seeded), otherwise "clustered".
 * @returns {false | "flat" | "clustered"}
 */
function quantize(img, colors, { layerDiff = 0, seeds = null, keep = null } = {}) {
  const { data } = img;
  const kept = keep ?? [];
  const exact = new Set();
  for (let i = 0; i < data.length && exact.size <= colors + kept.length; i += 4) {
    if (data[i + 3] < ALPHA_THRESHOLD) continue;
    exact.add((data[i] << 16) | (data[i + 1] << 8) | data[i + 2]);
  }
  if (exact.size <= colors + kept.length) return false;
  const backfill = dominantOpaqueColor(img);

  const binOf = (r, g, b) =>
    ((r >> QUANT_SHIFT) << (2 * QUANT_BITS)) |
    ((g >> QUANT_SHIFT) << QUANT_BITS) |
    (b >> QUANT_SHIFT);
  const binCount = 1 << (3 * QUANT_BITS);
  const sumR = new Float64Array(binCount);
  const sumG = new Float64Array(binCount);
  const sumB = new Float64Array(binCount);
  const hits = new Uint32Array(binCount);
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < ALPHA_THRESHOLD) continue;
    const bin = binOf(data[i], data[i + 1], data[i + 2]);
    sumR[bin] += data[i];
    sumG[bin] += data[i + 1];
    sumB[bin] += data[i + 2];
    hits[bin] += 1;
  }

  // One entry per occupied bin, at the bin's mean color. Clustering runs
  // in Oklab so splits and distances are perceptual: low color counts
  // keep visually distinct hues apart instead of merging them by raw RGB
  // proximity.
  let n = 0;
  for (let bin = 0; bin < binCount; bin++) if (hits[bin]) n += 1;
  const entryBin = new Int32Array(n);
  const count = new Float64Array(n);
  const lab = [new Float64Array(n), new Float64Array(n), new Float64Array(n)];
  const means = new Array(n);
  for (let bin = 0, e = 0; bin < binCount; bin++) {
    const h = hits[bin];
    if (!h) continue;
    means[e] = [Math.round(sumR[bin] / h), Math.round(sumG[bin] / h), Math.round(sumB[bin] / h)];
    const [L, A, B] = srgbToOklab(means[e]);
    entryBin[e] = bin;
    count[e] = h;
    lab[0][e] = L;
    lab[1][e] = A;
    lab[2][e] = B;
    e += 1;
  }

  // Median cut: repeatedly split the box with the largest channel range.
  // A box's widest channel is computed once, when the box is created.
  const makeBox = (members) => {
    let range = -1;
    let channel = 0;
    if (members.length >= 2) {
      for (let c = 0; c < 3; c++) {
        // Oklab, not RGB: a and b are signed and routinely negative, so RGB
        // sentinels leave max pinned at 0 and report an all-negative axis as
        // |min|, which wins splits it should lose.
        const values = lab[c];
        let min = Infinity;
        let max = -Infinity;
        for (const e of members) {
          if (values[e] < min) min = values[e];
          if (values[e] > max) max = values[e];
        }
        if (max - min > range) {
          range = max - min;
          channel = c;
        }
      }
    }
    return { members, range, channel };
  };
  const all = new Int32Array(n);
  for (let e = 0; e < n; e++) all[e] = e;
  // Flat art: when the most common colors already cover almost every
  // pixel, each gets its own one-color box and the splitting below stops
  // at once. Anti-alias blends stretch box ranges, so median cut would
  // split them off ahead of small solid accents. Near-duplicates of a
  // color already picked (resampling blends), and colors the tracer would
  // merge into it, count toward its coverage instead of taking a slot.
  // Rare colors take no slot either: when Max colors exceeds the art's
  // real colors, spare slots would go to edge blends and add fills.
  const opaqueCount = count.reduce((total, w) => total + w, 0);
  const common = [];
  let commonCount = 0;
  const candidates = colors <= FLAT_SEED_MAX_COLORS ? Array.from(all) : [];
  for (const e of candidates.sort((a, b) => count[b] - count[a])) {
    const near = common.some(
      (p) =>
        (lab[0][e] - lab[0][p]) ** 2 + (lab[1][e] - lab[1][p]) ** 2 + (lab[2][e] - lab[2][p]) ** 2 <
          FLAT_SEED_MIN_DISTANCE ** 2 || colorDistance(means[e], means[p]) <= layerDiff,
    );
    if (near) commonCount += count[e];
    else if (common.length < colors && count[e] >= opaqueCount * FLAT_SEED_MIN_SHARE) {
      common.push(e);
      commonCount += count[e];
    }
  }
  const given = seeds?.length ? seeds.slice(0, colors) : null;
  const seeded = given !== null || commonCount >= opaqueCount * FLAT_SEED_COVERAGE;
  const boxes = given ? [] : seeded ? common.map((e) => makeBox(Int32Array.of(e))) : [makeBox(all)];
  while (boxes.length < colors) {
    let boxIndex = -1;
    for (let i = 0; i < boxes.length; i++) {
      if (boxes[i].range >= 0 && (boxIndex === -1 || boxes[i].range > boxes[boxIndex].range)) {
        boxIndex = i;
      }
    }
    if (boxIndex === -1) break;
    const { members, channel } = boxes[boxIndex];
    const values = lab[channel];
    members.sort((a, b) => values[a] - values[b]);
    // Split at the pixel-weighted median so dominant colors get their own
    // box instead of being averaged away with rare neighbors.
    let totalCount = 0;
    for (const e of members) totalCount += count[e];
    let acc = 0;
    let half = 0;
    while (half < members.length - 1 && acc + count[members[half]] < totalCount / 2) {
      acc += count[members[half]];
      half += 1;
    }
    if (half === 0) half = 1;
    boxes.splice(boxIndex, 1, makeBox(members.subarray(0, half)), makeBox(members.subarray(half)));
  }

  // Weighted average color per box seeds the palette.
  const k = given ? given.length : boxes.length;
  const palette = new Float64Array(k * 3);
  given?.forEach((rgb, p) => palette.set(srgbToOklab(rgb), p * 3));
  boxes.forEach(({ members }, b) => {
    let total = 0;
    for (const e of members) {
      palette[b * 3] += lab[0][e] * count[e];
      palette[b * 3 + 1] += lab[1][e] * count[e];
      palette[b * 3 + 2] += lab[2][e] * count[e];
      total += count[e];
    }
    for (let c = 0; c < 3; c++) palette[b * 3 + c] /= total;
  });

  // Lloyd (k-means) refinement over the entries. Median-cut alone leaves
  // centroids off the natural clusters, so gradient pixels flip between
  // adjacent palette entries and trace into thousands of ragged paths.
  const assign = new Int32Array(n).fill(-1);
  const sums = new Float64Array(k * 4);
  const errors = new Float64Array(n);
  const minPopulation = opaqueCount * 0.001;
  for (let iter = 0; iter < 10; iter++) {
    let changed = false;
    for (let e = 0; e < n; e++) {
      const L = lab[0][e];
      const A = lab[1][e];
      const B = lab[2][e];
      let best = 0;
      let bestDist = Infinity;
      for (let p = 0; p < k; p++) {
        const dL = L - palette[p * 3];
        const dA = A - palette[p * 3 + 1];
        const dB = B - palette[p * 3 + 2];
        const dist = dL * dL + dA * dA + dB * dB;
        if (dist < bestDist) {
          bestDist = dist;
          best = p;
        }
      }
      errors[e] = bestDist * count[e];
      if (assign[e] !== best) {
        assign[e] = best;
        changed = true;
      }
    }
    // Seeded flat colors are the artwork's own: keep them exact rather
    // than letting the blends assigned to them pull them off.
    if (seeded) break;
    sums.fill(0);
    for (let e = 0; e < n; e++) {
      const p = assign[e] * 4;
      sums[p] += lab[0][e] * count[e];
      sums[p + 1] += lab[1][e] * count[e];
      sums[p + 2] += lab[2][e] * count[e];
      sums[p + 3] += count[e];
    }
    for (let p = 0; p < k; p++) {
      const w = sums[p * 4 + 3];
      if (w > 0) {
        palette[p * 3] = sums[p * 4] / w;
        palette[p * 3 + 1] = sums[p * 4 + 1] / w;
        palette[p * 3 + 2] = sums[p * 4 + 2] / w;
      }
    }
    // Reclaim slots below 0.1% coverage for the largest weighted error.
    // Leave a final assignment pass after reseeding before emitting pixels.
    if (iter < 9) {
      for (let p = 0; p < k; p++) {
        if (sums[p * 4 + 3] >= minPopulation) continue;
        let worst = -1;
        let worstError = 1e-12;
        for (let e = 0; e < n; e++) {
          if (sums[assign[e] * 4 + 3] >= minPopulation && errors[e] > worstError) {
            worst = e;
            worstError = errors[e];
          }
        }
        if (worst === -1) continue;
        for (let c = 0; c < 3; c++) palette[p * 3 + c] = lab[c][worst];
        errors[worst] = 0;
        changed = true;
      }
    }
    if (!changed) break;
  }

  // Painted fill colors join after clustering, exact and fixed, so they
  // neither take the image's own slots nor pull its colors off.
  const rgb = new Uint8Array((k + kept.length) * 3);
  for (let p = 0; p < k; p++) {
    rgb.set(oklabToSrgb([palette[p * 3], palette[p * 3 + 1], palette[p * 3 + 2]]), p * 3);
  }
  if (kept.length) {
    const keptLab = kept.map((color) => srgbToOklab(color));
    kept.forEach((color, j) => rgb.set(color, (k + j) * 3));
    for (let e = 0; e < n; e++) {
      let bestDist = Infinity;
      for (let p = 0; p < k; p++) {
        const dist =
          (lab[0][e] - palette[p * 3]) ** 2 +
          (lab[1][e] - palette[p * 3 + 1]) ** 2 +
          (lab[2][e] - palette[p * 3 + 2]) ** 2;
        if (dist < bestDist) {
          bestDist = dist;
          assign[e] = p;
        }
      }
      keptLab.forEach(([L, A, B], j) => {
        const dist = (lab[0][e] - L) ** 2 + (lab[1][e] - A) ** 2 + (lab[2][e] - B) ** 2;
        if (dist < bestDist) {
          bestDist = dist;
          assign[e] = k + j;
        }
      });
    }
  }
  const binToPalette = new Int32Array(binCount);
  for (let e = 0; e < n; e++) binToPalette[entryBin[e]] = assign[e];
  const backfillEntry = binToPalette[binOf(backfill[0], backfill[1], backfill[2])] * 3;
  for (let i = 0; i < data.length; i += 4) {
    const p =
      data[i + 3] < ALPHA_THRESHOLD
        ? backfillEntry
        : binToPalette[binOf(data[i], data[i + 1], data[i + 2])] * 3;
    data[i] = rgb[p];
    data[i + 1] = rgb[p + 1];
    data[i + 2] = rgb[p + 2];
  }
  return seeded ? "flat" : "clustered";
}

/**
 * 3x3 per-channel median filter on opaque RGB, repeated `passes` times.
 * Kills sensor/compression noise while preserving edges exactly, unlike
 * a blur which grays the very boundaries the tracer follows. Alpha is
 * untouched and transparent neighbors are excluded from the window.
 */
function medianFilter(img, passes = 1) {
  const { data, width, height } = img;
  const out = new Uint8ClampedArray(data.length);
  // A 3x3 window holds at most nine samples per channel. One fixed buffer
  // plus an insertion sort avoids three Array#sort calls with a JS
  // comparator per pixel, which dominated the cost of this filter.
  const win = new Uint8Array(27);

  for (let pass = 0; pass < passes; pass++) {
    out.set(data);
    for (let y = 0; y < height; y++) {
      const yStart = y > 0 ? -1 : 0;
      const yEnd = y < height - 1 ? 1 : 0;
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        if (data[i + 3] < ALPHA_THRESHOLD) continue;
        const xStart = x > 0 ? -1 : 0;
        const xEnd = x < width - 1 ? 1 : 0;
        let count = 0;
        for (let dy = yStart; dy <= yEnd; dy++) {
          let j = ((y + dy) * width + x + xStart) * 4;
          for (let dx = xStart; dx <= xEnd; dx++, j += 4) {
            if (data[j + 3] < ALPHA_THRESHOLD) continue;
            win[count] = data[j];
            win[count + 9] = data[j + 1];
            win[count + 18] = data[j + 2];
            count += 1;
          }
        }
        const mid = count >> 1;
        for (let c = 0; c < 3; c++) {
          const base = c * 9;
          for (let k = base + 1; k < base + count; k++) {
            const value = win[k];
            let m = k - 1;
            while (m >= base && win[m] > value) {
              win[m + 1] = win[m];
              m -= 1;
            }
            win[m + 1] = value;
          }
          out[i + c] = win[base + mid];
        }
      }
    }
    data.set(out);
  }
  return img;
}

/**
 * 3x3 majority filter on opaque RGB values. Cleans single-pixel dithering
 * left along region boundaries after quantization, which otherwise traces
 * into hundreds of tiny paths. Alpha is untouched. Returns a new buffer
 * written back into img.
 */
function modeFilter(img) {
  const { data, width, height } = img;
  const out = new Uint8ClampedArray(data);
  // At most nine neighbors, so a linear scan over fixed buffers beats
  // hashing each key through a Map that has to be cleared per pixel.
  const keys = new Int32Array(9);
  const tally = new Int32Array(9);
  for (let y = 0; y < height; y++) {
    const yStart = y > 0 ? -1 : 0;
    const yEnd = y < height - 1 ? 1 : 0;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (data[i + 3] < ALPHA_THRESHOLD) continue;
      const xStart = x > 0 ? -1 : 0;
      const xEnd = x < width - 1 ? 1 : 0;
      let unique = 0;
      let best = -1;
      let bestCount = 0;
      for (let dy = yStart; dy <= yEnd; dy++) {
        let j = ((y + dy) * width + x + xStart) * 4;
        for (let dx = xStart; dx <= xEnd; dx++, j += 4) {
          if (data[j + 3] < ALPHA_THRESHOLD) continue;
          const key = (data[j] << 16) | (data[j + 1] << 8) | data[j + 2];
          let slot = 0;
          while (slot < unique && keys[slot] !== key) slot += 1;
          if (slot === unique) {
            keys[slot] = key;
            tally[slot] = 0;
            unique += 1;
          }
          const n = ++tally[slot];
          if (n > bestCount) {
            bestCount = n;
            best = key;
          }
        }
      }
      // Replace only clear majorities so real detail survives.
      if (best >= 0 && bestCount >= 5) {
        out[i] = (best >> 16) & 0xff;
        out[i + 1] = (best >> 8) & 0xff;
        out[i + 2] = best & 0xff;
      }
    }
  }
  data.set(out);
  return img;
}

/**
 * Wrap runs of adjacent same-fill <path> elements in a shared
 * <g fill="..."> and drop the per-path fill attributes. Only paths
 * separated by whitespace count as adjacent, and only adjacent runs
 * merge: stacked output relies on document order for z-order, so
 * non-adjacent same-fill paths must stay where they are.
 */
function groupSvgFills(svgText) {
  const fillOf = (path) => (path.match(/\sfill="([^"]*)"/) || [])[1] || null;
  const matches = [...svgText.matchAll(/<path\b[^>]*\/>/g)];
  let out = "";
  let cursor = 0;
  let i = 0;
  while (i < matches.length) {
    const fill = fillOf(matches[i][0]);
    let j = i;
    if (fill) {
      while (
        j + 1 < matches.length &&
        fillOf(matches[j + 1][0]) === fill &&
        /^\s*$/.test(svgText.slice(matches[j].index + matches[j][0].length, matches[j + 1].index))
      ) {
        j++;
      }
    }
    if (j > i) {
      out += svgText.slice(cursor, matches[i].index) + `<g fill="${fill}">\n`;
      for (let k = i; k <= j; k++) {
        out += matches[k][0].replace(/\s+fill="[^"]*"/, "");
        out +=
          k < j
            ? svgText.slice(matches[k].index + matches[k][0].length, matches[k + 1].index)
            : "\n";
      }
      out += "</g>";
      cursor = matches[j].index + matches[j][0].length;
    }
    i = j + 1;
  }
  return out + svgText.slice(cursor);
}

/**
 * Regroup same-fill paths after palette edits and name each group
 * id="color-rrggbb" so design tools list layers by color. Stacked output
 * keeps document order (z-order), so a color drawn in several runs gets
 * numbered ids (color-ffffff-2). Mosaic (cutout) shapes never overlap,
 * which makes reordering safe: each color collects into one group, in
 * order of first appearance. Hidden ("none") and non-hex fills stay
 * unnamed.
 * @param {string} svgText
 * @param {{ mosaic?: boolean }} [options]
 */
function nameColorGroups(svgText, { mosaic = false } = {}) {
  // finalizeSvg groups never nest, so each <g fill> closes at the next </g>.
  let out = svgText.replace(/<g fill="([^"]*)">([\s\S]*?)<\/g>/g, (_, fill, inner) =>
    inner.replace(/<path\b/g, `<path fill="${fill}"`).trim(),
  );
  if (mosaic) {
    const paths = [...out.matchAll(/<path\b[^>]*\/>/g)];
    const contiguous = paths.every(
      (m, i) =>
        i === 0 || /^\s*$/.test(out.slice(paths[i - 1].index + paths[i - 1][0].length, m.index)),
    );
    if (paths.length > 1 && contiguous) {
      /** @type {Map<string, string[]>} */
      const byFill = new Map();
      for (const [path] of paths) {
        const fill = path.match(/\sfill="([^"]*)"/)?.[1] ?? "";
        byFill.set(fill, [...(byFill.get(fill) ?? []), path]);
      }
      const first = paths[0];
      const last = paths.at(-1);
      out =
        out.slice(0, first.index) +
        [...byFill.values()].flat().join("\n") +
        out.slice(last.index + last[0].length);
    }
  }
  /** @type {Map<string, number>} */
  const seen = new Map();
  const idFor = (/** @type {string} */ fill) => {
    const hex = fill.match(/^#([0-9a-f]{6})$/i)?.[1]?.toLowerCase();
    if (!hex) return null;
    const n = (seen.get(hex) ?? 0) + 1;
    seen.set(hex, n);
    return n === 1 ? `color-${hex}` : `color-${hex}-${n}`;
  };
  // After grouping, only group tags and lone paths carry a fill.
  return groupSvgFills(out).replace(
    /<g fill="([^"]*)">|<path\b(?=[^>]*\sfill="([^"]*)")/g,
    (tag, groupFill, pathFill) => {
      const id = idFor(groupFill ?? pathFill);
      if (!id) return tag;
      return groupFill === undefined ? `<path id="${id}"` : `<g fill="${groupFill}" id="${id}">`;
    },
  );
}

/** Perpendicular distance from point p to the line through a and b. */
function distanceToChord(p, a, b) {
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const len = Math.hypot(vx, vy);
  if (len < 1e-9) return Math.hypot(p.x - a.x, p.y - a.y);
  return Math.abs((p.x - a.x) * vy - (p.y - a.y) * vx) / len;
}

const num = (n) => String(Number(n));

/**
 * Straighten traced path data: cubics whose control points sit within
 * `tolerance` of their chord become lines, and runs of consecutive lines
 * whose interior points sit within `tolerance` of the run's chord merge
 * into one line. Corners survive because merging stops as soon as a
 * point leaves the tolerance band. Output keeps the tracer's absolute
 * M/L/C/Z shape, so parseSvgPaths and the eraser keep working.
 */
function straightenPaths(svgText, tolerance) {
  if (!(tolerance > 0)) return svgText;
  return svgText.replace(/(<path\b[^>]*?\sd=")([^"]*)(")/g, (_, head, d, tail) => {
    return head + straightenPathData(d, tolerance) + tail;
  });
}

function straightenPathData(d, tolerance) {
  const tokens = d.match(/-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?|[A-Za-z]/g) || [];
  let out = "";
  let i = 0;
  let cmd = null;
  let point = { x: 0, y: 0 };
  // Lines buffered for merging: linePoints[0] is the run's anchor.
  let linePoints = [];
  const read = () => Number(tokens[i++]);

  const flushLines = () => {
    while (linePoints.length > 1) {
      const anchor = linePoints[0];
      // Longest prefix whose interior points all fit the tolerance band.
      let end = 1;
      for (let j = 2; j < linePoints.length; j++) {
        let fits = true;
        for (let k = 1; k < j && fits; k++) {
          fits = distanceToChord(linePoints[k], anchor, linePoints[j]) <= tolerance;
        }
        if (fits) end = j;
        else break;
      }
      out += `L${num(linePoints[end].x)} ${num(linePoints[end].y)} `;
      linePoints = linePoints.slice(end);
    }
    linePoints = [];
  };

  while (i < tokens.length) {
    if (/^[A-Za-z]$/.test(tokens[i])) {
      cmd = tokens[i++];
      if (cmd === "Z" || cmd === "z") {
        flushLines();
        out += "Z ";
        cmd = null;
        continue;
      }
    }
    switch (cmd) {
      case "M": {
        flushLines();
        point = { x: read(), y: read() };
        out += `M${num(point.x)} ${num(point.y)} `;
        cmd = "L"; // extra pairs after M are implicit lines
        break;
      }
      case "L": {
        const to = { x: read(), y: read() };
        if (!linePoints.length) linePoints.push(point);
        linePoints.push(to);
        point = to;
        break;
      }
      case "C": {
        const c1 = { x: read(), y: read() };
        const c2 = { x: read(), y: read() };
        const to = { x: read(), y: read() };
        const straight =
          distanceToChord(c1, point, to) <= tolerance &&
          distanceToChord(c2, point, to) <= tolerance;
        if (straight) {
          if (!linePoints.length) linePoints.push(point);
          linePoints.push(to);
        } else {
          flushLines();
          out += `C${num(c1.x)} ${num(c1.y)} ${num(c2.x)} ${num(c2.y)} ${num(to.x)} ${num(to.y)} `;
        }
        point = to;
        break;
      }
      default:
        return d; // unexpected command: leave the path untouched
    }
  }
  flushLines();
  return out;
}

/**
 * Rewrite the SVG root so the document keeps the source pixel dimensions
 * with a viewBox, hiding the internal upscale factor, and group same-fill
 * paths to shrink the file. Returns the root unchanged when it does not
 * match the expected vtracer shape.
 */
function finalizeSvg(svgText, width, height) {
  return groupSvgFills(svgText).replace(
    /(<svg[^>]*?) width="(\d+)" height="(\d+)">/,
    (_, head, w, h) => `${head} width="${width}" height="${height}" viewBox="0 0 ${w} ${h}">`,
  );
}

/**
 * True when a worker/module failure message indicates a stale or
 * mismatched cached module (deploy caught mid-propagation, service
 * worker pinned the bad copy) rather than a tracing error.
 */
function isStaleModuleError(message) {
  return /importing binding|does not provide an export|SyntaxError|import.* module/i.test(
    String(message || ""),
  );
}

/** Count path elements in an SVG string. */
function countPaths(svgText) {
  return (svgText.match(/<path\b/g) || []).length;
}

/**
 * Resolve preset + explicit values the same way the CLI does:
 * explicit user values win over preset values, preset over defaults.
 * `explicit` holds only the keys the user actually set.
 */
function resolveSettings(preset, explicit = {}) {
  const merged = { ...DEFAULTS, ...(preset ? PRESETS[preset] : {}) };
  for (const [key, value] of Object.entries(explicit)) {
    if (value !== undefined && value !== null) merged[key] = value;
  }
  return merged;
}

// ---------------------------------------------------------------- js/palette.js
// Palette editing: read the traced colors out of the SVG and swap fill
// values. Edits recolor existing shapes only; geometry never changes.

/** Largest palette the swatch grid lists; above this, pick from the result. */
const PALETTE_GRID_MAX = 32;

const FILL_ATTR = /\sfill="([^"]*)"/g;

/** @param {string} value @returns {string | null} "#RRGGBB" or null for non-hex fills */
function normalizeFill(value) {
  const rgb = /** @type {[number, number, number] | null} */ (parseHexColor(value));
  return rgb ? toHexColor(rgb) : null;
}

/**
 * Distinct hex fills in the SVG, most used first. Counts fill attributes
 * (on paths, groups and rects), not painted area.
 * @param {string} svgText
 * @returns {{ fill: string, count: number }[]}
 */
function svgPalette(svgText) {
  /** @type {Map<string, number>} */
  const counts = new Map();
  for (const [, value] of svgText.matchAll(FILL_ATTR)) {
    const fill = normalizeFill(value);
    if (fill) counts.set(fill, (counts.get(fill) ?? 0) + 1);
  }
  return [...counts]
    .map(([fill, count]) => ({ fill, count }))
    .sort((a, b) => b.count - a.count || (a.fill < b.fill ? -1 : a.fill > b.fill ? 1 : 0));
}

/**
 * Distinct opaque colors of the reduced raster, most used first, or null
 * when there are more than `maxColors` (color reduction off). This is the
 * real palette: vtracer averages each region's pixels, so one reduced
 * color reaches the SVG as many near-identical fills.
 * @param {{ width: number, height: number, data: Uint8ClampedArray } | null} imageData
 * @param {number} [maxColors]
 * @returns {{ fill: string, count: number }[] | null}
 */
function rasterPalette(imageData, maxColors = 256) {
  if (!imageData?.data) return null;
  const { data } = imageData;
  /** @type {Map<number, number>} */
  const counts = new Map();
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < ALPHA_THRESHOLD) continue;
    const key = (data[i] << 16) | (data[i + 1] << 8) | data[i + 2];
    counts.set(key, (counts.get(key) ?? 0) + 1);
    if (counts.size > maxColors) return null;
  }
  return [...counts]
    .map(([key, count]) => ({
      fill: toHexColor([(key >> 16) & 0xff, (key >> 8) & 0xff, key & 0xff]),
      count,
    }))
    .sort((a, b) => b.count - a.count || (a.fill < b.fill ? -1 : a.fill > b.fill ? 1 : 0));
}

/**
 * Each distinct SVG fill to its nearest palette color in Oklab.
 * @param {string} svgText
 * @param {{ fill: string }[]} palette
 * @returns {Map<string, string>}
 */
function paletteMapping(svgText, palette) {
  /** @type {Map<string, string>} */
  const mapping = new Map();
  for (const { fill } of svgPalette(svgText)) {
    const rgb = /** @type {[number, number, number]} */ (parseHexColor(fill));
    mapping.set(fill, nearestFill(rgb, palette) ?? fill);
  }
  return mapping;
}

/**
 * Snap every hex fill to its nearest palette color. vtracer fills each
 * shape with its pixels' average, so a trace of an 8-color raster can
 * carry dozens of near-duplicate fills; this leaves only the 8.
 * @param {string} svgText
 * @param {{ fill: string }[]} palette
 */
function snapFills(svgText, palette) {
  const mapping = paletteMapping(svgText, palette);
  return svgText.replace(FILL_ATTR, (attr, value) => {
    const fill = normalizeFill(value);
    const snapped = fill && mapping.get(fill);
    return snapped ? ` fill="${snapped}"` : attr;
  });
}

/**
 * Rewrite fills through `edits` (palette "#RRGGBB" to new hex or "none"). `mapping`
 * resolves each SVG fill to its palette color first; without it, fills
 * match edits exactly. One pass over the attributes, so swapping two
 * colors cannot chain into one.
 * @param {string} svgText
 * @param {Map<string, string>} edits
 * @param {Map<string, string> | null} [mapping]
 */
function recolorSvg(svgText, edits, mapping = null) {
  if (edits.size === 0) return svgText;
  return svgText.replace(FILL_ATTR, (attr, value) => {
    const fill = normalizeFill(value);
    const key = fill && (mapping?.get(fill) ?? fill);
    const edited = key && edits.get(key);
    return edited ? ` fill="${edited}"` : attr;
  });
}

/**
 * Palette fill closest to `rgb` in Oklab. vtracer may emit fills that
 * differ slightly from the raster's cluster colors, so picks snap.
 * @param {[number, number, number]} rgb
 * @param {{ fill: string }[]} palette
 * @returns {string | null}
 */
function nearestFill(rgb, palette) {
  const [L, a, b] = srgbToOklab(rgb);
  let best = null;
  let bestDist = Infinity;
  for (const { fill } of palette) {
    const parsed = parseHexColor(fill);
    if (!parsed) continue;
    const [L2, a2, b2] = srgbToOklab(parsed);
    const dist = (L - L2) ** 2 + (a - a2) ** 2 + (b - b2) ** 2;
    if (dist < bestDist) {
      bestDist = dist;
      best = fill;
    }
  }
  return best;
}

/**
 * RGB at normalized coordinates, or null where the pixel is transparent
 * (knocked-out background has no traced fill to edit).
 * @param {{ width: number, height: number, data: Uint8ClampedArray } | null} imageData
 * @param {number} nx
 * @param {number} ny
 * @returns {[number, number, number] | null}
 */
function pickColor(imageData, nx, ny) {
  if (!imageData?.width || !imageData?.height || !imageData.data) return null;
  const x = Math.min(imageData.width - 1, Math.max(0, Math.floor(nx * imageData.width)));
  const y = Math.min(imageData.height - 1, Math.max(0, Math.floor(ny * imageData.height)));
  const offset = (y * imageData.width + x) * 4;
  const { data } = imageData;
  if (data[offset + 3] < ALPHA_THRESHOLD) return null;
  return [data[offset], data[offset + 1], data[offset + 2]];
}

/**
 * Fill under a stencil raster sample. The worker's stencil raster is
 * black ink on white whatever the ink; white ink only swaps the shape fill
 * in the SVG to #FFFFFF, so nearestFill on the raw sample would open the
 * inverse color. Neither ink has a background fill, so white samples pick
 * nothing.
 * @param {[number, number, number]} rgb
 * @param {string} ink "black" or "white"
 * @returns {string | null}
 */
function stencilFill([r], ink) {
  const dark = r < 128;
  if (!dark) return null;
  return ink === "white" ? "#FFFFFF" : "#000000";
}

/**
 * Drop edits whose original color no longer appears in the trace. Exact
 * match only: a regenerated palette has no reliable correspondence.
 * @param {Map<string, string>} edits mutated in place
 * @param {{ fill: string }[]} palette
 * @returns {number} how many edits were removed
 */
function pruneEdits(edits, palette) {
  const present = new Set(palette.map((entry) => entry.fill));
  let removed = 0;
  for (const fill of [...edits.keys()]) {
    if (!present.has(fill)) {
      edits.delete(fill);
      removed++;
    }
  }
  return removed;
}

/**
 * Swatches for the palette grid: colors edited to the same value are one
 * merged swatch, named by its largest member. Hidden colors stay apart.
 * @param {{ fill: string }[]} palette sorted largest area first
 * @param {Map<string, string>} edits
 * @returns {{ fill: string, color: string, members: string[] }[]}
 */
function mergeGroups(palette, edits) {
  const groups = [];
  /** @type {Map<string, { fill: string, color: string, members: string[] }>} */
  const byColor = new Map();
  for (const { fill } of palette) {
    const color = edits.get(fill) ?? fill;
    const group = color !== "none" && byColor.get(color);
    if (group) {
      group.members.push(fill);
      continue;
    }
    const created = { fill, color, members: [fill] };
    groups.push(created);
    if (color !== "none") byColor.set(color, created);
  }
  return groups;
}

/**
 * Merge `fills` into one color: the current color of the largest visible
 * one. Records an edit for every other member and returns the color.
 * @param {Map<string, string>} edits
 * @param {{ fill: string }[]} palette sorted largest area first
 * @param {string[]} fills
 * @returns {string}
 */
function mergeEdits(edits, palette, fills) {
  const chosen = new Set(fills);
  const ordered = palette.map((entry) => entry.fill).filter((fill) => chosen.has(fill));
  const largest = ordered.find((fill) => (edits.get(fill) ?? fill) !== "none");
  const color = largest ? (edits.get(largest) ?? largest) : ordered[0];
  for (const fill of ordered) {
    if (fill === color) edits.delete(fill);
    else edits.set(fill, color);
  }
  return color;
}

// ---------------------------------------------------------------- js/vectorexport.js
// DXF and PDF writers for traced output. Pure string work, Node-testable.
// The input is our own finalized SVG, which keeps a very regular shape:
// uppercase absolute M/L/C/Z path data, per-path fill and translate().

/**
 * @typedef {{ x: number, y: number }} VecPoint
 * @typedef {{ kind: "line", to: VecPoint } | { kind: "cubic", c1: VecPoint, c2: VecPoint, to: VecPoint }} VecSegment
 * @typedef {{ start: VecPoint, segments: VecSegment[], closed: boolean }} VecSubpath
 * @typedef {{ fill: string, subpaths: VecSubpath[] }} VecPath
 * @typedef {{ width: number, height: number, paths: VecPath[] }} ParsedSvg
 */

/** Trim a number to a compact decimal string (max 4 places). */
function fmt(n) {
  return String(Number(n.toFixed(4)));
}

/**
 * Parse the traced SVG into { width, height, paths } where each path is
 * { fill, subpaths: [{ start, segments, closed }] } and each segment is
 * { kind: "line", to } or { kind: "cubic", c1, c2, to }. Coordinates are
 * in viewBox space with the per-path translate applied.
 *
 * @param {string} svgText
 * @returns {ParsedSvg}
 */
function parseSvgPaths(svgText) {
  const vb = svgText.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  const wh = svgText.match(/<svg[^>]*? width="([\d.]+)"[^>]*? height="([\d.]+)"/);
  const width = Number(vb ? vb[1] : (wh?.[1] ?? 0));
  const height = Number(vb ? vb[2] : (wh?.[2] ?? 0));

  // Walk groups and paths in document order: finalizeSvg moves the fill
  // of grouped same-fill paths onto the enclosing <g>, so a path without
  // its own fill inherits the innermost group's.
  const paths = [];
  const groupFills = [];
  for (const el of svgText.matchAll(/<g\b[^>]*>|<\/g>|<path\b[^>]*>/g)) {
    const tag = el[0];
    if (tag.startsWith("<g")) {
      groupFills.push(tag.match(/\sfill="([^"]*)"/)?.[1] ?? groupFills.at(-1));
      continue;
    }
    if (tag.startsWith("</g")) {
      groupFills.pop();
      continue;
    }
    const d = tag.match(/\sd="([^"]*)"/)?.[1];
    if (!d) continue;
    const fill = tag.match(/\sfill="([^"]*)"/)?.[1] ?? groupFills.at(-1) ?? "#000000";
    const tr = tag.match(/translate\((-?[\d.]+)[, ](-?[\d.]+)\)/);
    const dx = tr ? Number(tr[1]) : 0;
    const dy = tr ? Number(tr[2]) : 0;
    paths.push({ fill, subpaths: parsePathData(d, dx, dy) });
  }
  return { width, height, paths };
}

function parsePathData(d, dx, dy) {
  const tokens = d.match(/-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?|[A-Za-z]/g) || [];
  const subpaths = [];
  let current = null;
  let cmd = null;
  let point = { x: 0, y: 0 };
  let i = 0;
  const read = () => Number(tokens[i++]);
  while (i < tokens.length) {
    if (/^[A-Za-z]$/.test(tokens[i])) {
      cmd = tokens[i++];
      if (cmd === "Z" || cmd === "z") {
        if (current) {
          current.closed = true;
          point = current.start;
        }
        continue;
      }
    }
    switch (cmd) {
      case "M": {
        point = { x: read() + dx, y: read() + dy };
        current = { start: point, segments: [], closed: false };
        subpaths.push(current);
        cmd = "L"; // extra coordinate pairs after M are implicit lines
        break;
      }
      case "L": {
        point = { x: read() + dx, y: read() + dy };
        current.segments.push({ kind: "line", to: point });
        break;
      }
      case "C": {
        const c1 = { x: read() + dx, y: read() + dy };
        const c2 = { x: read() + dx, y: read() + dy };
        point = { x: read() + dx, y: read() + dy };
        current.segments.push({ kind: "cubic", c1, c2, to: point });
        break;
      }
      default:
        throw new Error(`Unsupported path command: ${cmd}`);
    }
  }
  return subpaths;
}

/**
 * Flatten a cubic Bezier into line-segment end points (excluding p0,
 * including p1), subdividing until the control points sit within `tol`
 * of the chord.
 */
function flattenCubic(p0, c1, c2, p1, tol, depth = 0) {
  const flatEnough = (p) => {
    const vx = p1.x - p0.x;
    const vy = p1.y - p0.y;
    const len = Math.hypot(vx, vy);
    if (len < 1e-9) return Math.hypot(p.x - p0.x, p.y - p0.y) <= tol;
    return Math.abs((p.x - p0.x) * vy - (p.y - p0.y) * vx) / len <= tol;
  };
  if (depth >= 16 || (flatEnough(c1) && flatEnough(c2))) return [p1];
  const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const p01 = mid(p0, c1);
  const p12 = mid(c1, c2);
  const p23 = mid(c2, p1);
  const p012 = mid(p01, p12);
  const p123 = mid(p12, p23);
  const p0123 = mid(p012, p123);
  return [
    ...flattenCubic(p0, p01, p012, p0123, tol, depth + 1),
    ...flattenCubic(p0123, p123, p23, p1, tol, depth + 1),
  ];
}

/** Nearest AutoCAD color index for a hex fill (basic ACI palette). */
function aciColor(hex) {
  const n = parseInt(hex.slice(1), 16);
  const rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  /** @type {[number, number[]][]} */
  const palette = [
    [1, [255, 0, 0]],
    [2, [255, 255, 0]],
    [3, [0, 255, 0]],
    [4, [0, 255, 255]],
    [5, [0, 0, 255]],
    [6, [255, 0, 255]],
    [7, [255, 255, 255]],
    [7, [0, 0, 0]], // ACI 7 renders as black-or-white depending on background
    [8, [128, 128, 128]],
  ];
  let best = 7;
  let bestDist = Infinity;
  for (const [aci, c] of palette) {
    const dist = (rgb[0] - c[0]) ** 2 + (rgb[1] - c[1]) ** 2 + (rgb[2] - c[2]) ** 2;
    if (dist < bestDist) {
      bestDist = dist;
      best = aci;
    }
  }
  return best;
}

// Curve flattening tolerance in viewBox pixels: 0.2 px of a >=2048 px
// trace is far below any cutter's mechanical resolution.
const FLATTEN_TOL = 0.2;

/**
 * Write a minimal DXF R12 document: one closed POLYLINE per subpath,
 * one layer per fill color, y axis flipped to DXF's y-up convention.
 * `scale` converts viewBox pixels to output units (e.g. mm).
 *
 * @param {ParsedSvg} parsed
 * @param {{ scale?: number }} [options]
 */
function toDxf(parsed, { scale = 1 } = {}) {
  const { height } = parsed;
  const paths = parsed.paths.filter((path) => path.fill !== "none");
  const g = (code, value) => `${code}\n${value}\n`;
  const layers = new Map();
  for (const path of paths) {
    layers.set(`C_${path.fill.replace("#", "")}`, aciColor(path.fill));
  }

  let out = "";
  out += g(0, "SECTION") + g(2, "HEADER") + g(9, "$ACADVER") + g(1, "AC1009") + g(0, "ENDSEC");
  out += g(0, "SECTION") + g(2, "TABLES") + g(0, "TABLE") + g(2, "LAYER") + g(70, layers.size);
  for (const [name, aci] of layers) {
    out += g(0, "LAYER") + g(2, name) + g(70, 0) + g(62, aci) + g(6, "CONTINUOUS");
  }
  out += g(0, "ENDTAB") + g(0, "ENDSEC");
  out += g(0, "SECTION") + g(2, "ENTITIES");

  for (const path of paths) {
    const layer = `C_${path.fill.replace("#", "")}`;
    for (const sub of path.subpaths) {
      let points = [sub.start];
      let prev = sub.start;
      for (const seg of sub.segments) {
        if (seg.kind === "line") points.push(seg.to);
        else points.push(...flattenCubic(prev, seg.c1, seg.c2, seg.to, FLATTEN_TOL));
        prev = seg.to;
      }
      // A closed polyline does not need an end point equal to the start.
      const last = points[points.length - 1];
      if (sub.closed && points.length > 1 && last.x === sub.start.x && last.y === sub.start.y) {
        points = points.slice(0, -1);
      }
      out += g(0, "POLYLINE") + g(8, layer) + g(66, 1) + g(70, sub.closed ? 1 : 0);
      for (const p of points) {
        out +=
          g(0, "VERTEX") +
          g(8, layer) +
          g(10, fmt(p.x * scale)) +
          g(20, fmt((height - p.y) * scale)) +
          g(30, 0);
      }
      out += g(0, "SEQEND");
    }
  }
  out += g(0, "ENDSEC") + g(0, "EOF");
  return out;
}

/**
 * Write a single-page vector PDF. Curves stay curves (SVG cubics map to
 * the PDF `c` operator 1:1); holes survive through nonzero fill. Page
 * size in points; defaults to the pixel dimensions at 96 dpi.
 *
 * @param {ParsedSvg} parsed
 * @param {{ pageWidth?: number, pageHeight?: number }} [options]
 */
function toPdf(parsed, { pageWidth, pageHeight } = {}) {
  const { width, height, paths } = parsed;
  const pw = pageWidth ?? (width * 72) / 96;
  const ph = pageHeight ?? (height * 72) / 96;

  // One transform maps SVG space (y down) onto the page (y up).
  let content = `${fmt(pw / width)} 0 0 ${fmt(-ph / height)} 0 ${fmt(ph)} cm\n`;
  const fillColor = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    return `${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => fmt(v / 255)).join(" ")} rg\n`;
  };
  for (const path of paths) {
    if (path.fill === "none") continue;
    content += fillColor(path.fill);
    for (const sub of path.subpaths) {
      content += `${fmt(sub.start.x)} ${fmt(sub.start.y)} m\n`;
      for (const seg of sub.segments) {
        if (seg.kind === "line") {
          content += `${fmt(seg.to.x)} ${fmt(seg.to.y)} l\n`;
        } else {
          content += `${fmt(seg.c1.x)} ${fmt(seg.c1.y)} ${fmt(seg.c2.x)} ${fmt(seg.c2.y)} ${fmt(seg.to.x)} ${fmt(seg.to.y)} c\n`;
        }
      }
      if (sub.closed) content += "h\n";
    }
    content += " f\n";
  }

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${fmt(pw)} ${fmt(ph)}] /Contents 4 0 R /Resources << >> >>`,
    `<< /Length ${content.length} >>\nstream\n${content}endstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [];
  objects.forEach((body, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return pdf;
}

// ---------------------------------------------------------------- pkg/rastertrace_wasm.js
/* @ts-self-types="./rastertrace_wasm.d.ts" */

/**
 * Trace an RGBA pixel buffer into an SVG document string.
 *
 * `pixels` is tightly packed RGBA, `width * height * 4` bytes.
 * `mode` is "spline", "polygon", or "none" (pixel-perfect).
 * `hierarchical` is "stacked" (shapes layered on top of each other) or
 * "cutout" (non-overlapping adjacent shapes). `color_mode` is "color" or
 * "binary" (black/white stencil keyed on r < 128). Remaining parameters
 * match the vtracer `Config` fields of the same names.
 * @param {Uint8Array} pixels
 * @param {number} width
 * @param {number} height
 * @param {string} mode
 * @param {string} hierarchical
 * @param {string} color_mode
 * @param {number} filter_speckle
 * @param {number} color_precision
 * @param {number} layer_difference
 * @param {number} corner_threshold
 * @param {number} length_threshold
 * @param {number} max_iterations
 * @param {number} splice_threshold
 * @param {number} path_precision
 * @returns {string}
 */
function trace(pixels, width, height, mode, hierarchical, color_mode, filter_speckle, color_precision, layer_difference, corner_threshold, length_threshold, max_iterations, splice_threshold, path_precision) {
    let deferred6_0;
    let deferred6_1;
    try {
        const ptr0 = passArray8ToWasm0(pixels, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(mode, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(hierarchical, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passStringToWasm0(color_mode, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len3 = WASM_VECTOR_LEN;
        const ret = wasm.trace(ptr0, len0, width, height, ptr1, len1, ptr2, len2, ptr3, len3, filter_speckle, color_precision, layer_difference, corner_threshold, length_threshold, max_iterations, splice_threshold, path_precision);
        var ptr5 = ret[0];
        var len5 = ret[1];
        if (ret[3]) {
            ptr5 = 0; len5 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred6_0 = ptr5;
        deferred6_1 = len5;
        return getStringFromWasm0(ptr5, len5);
    } finally {
        wasm.__wbindgen_free(deferred6_0, deferred6_1, 1);
    }
}
function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg_Error_92b29b0548f8b746: function(arg0, arg1) {
            const ret = Error(getStringFromWasm0(arg0, arg1));
            return ret;
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
        },
    };
    return {
        __proto__: null,
        "./rastertrace_wasm_bg.js": import0,
    };
}

function getStringFromWasm0(ptr, len) {
    return decodeText(ptr >>> 0, len);
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_externrefs.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    };
}

let WASM_VECTOR_LEN = 0;

let wasmModule, wasmInstance, wasm;
function __wbg_finalize_init(instance, module) {
    wasmInstance = instance;
    wasm = instance.exports;
    wasmModule = module;
    cachedUint8ArrayMemory0 = null;
    wasm.__wbindgen_start();
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = module.ok && expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (module_or_path === undefined) {
        module_or_path = null;
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}



  // ---------------------------------------------------------------- ImageCraft's driver (the steps of RasterTrace's worker, in order)
  const B64 = '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KAKoAiATQf8BcWo2AqgCIAMgAygCpAIgC0H/AXFqNgKkAgJAAkACQCADKALUAiIHIAMoAswCIghGIAMoAtgCIgIgAygC0AIiBUZxRQRAIAQgCEgNASAEQQFqIgQgB0wNAiADIAQ2AtQCDAILIAMgBDYCzAIgAyAEQQFqNgLUAiADIAk2AtACIAMgCUEBajYC2AIMAgsgAyAENgLMAgsgBSAJTARAIAIgCUEBaiICTg0BIAMgAjYC2AIMAQsgAyAJNgLQAgsCQCADKAL8ASIEIAMoAqABIgJPBEAgAygCmAEgAkYEQCADQZgBahCpAQsgAygCnAEgAkHcAGxqIANBhAJqQdwA/AoAACADIAJBAWo2AqABDAELAkAgAygCnAEgBEHcAGxqIgIoAgAiBARAIAJBBGooAgAiBUEEaygCACIHQXhxIgggBEECdCIEQQRBCCAHQQNxIgcbakkNCyAHQQAgCCAEQSdqSxsNDCAFEDkLIAIoAgwiBARAIAJBEGooAgAiBUEEaygCACIHQXhxIgggBEECdCIEQQRBCCAHQQNxIgcbakkNCyAHQQAgCCAEQSdqSxsNASAFEDkLIAIgA0GEAmpB3AD8CgAADAELDAoLIAMoAqwBIgIgAUsEQCADKAKoASABQQJ0aiADKAL8ASICNgIAIAMgAkEBajYC/AEMAQsgASACQaDuwAAQuAEACyABQQFqIgEgEkcNAQsLIAMoAvgBICFqIRIgAygCrAEhAgsgAyASNgL4ASACIBJLDQAgAygCnAEiASADKAKgASICQdwAbCIEaiEIAkAgAkUNACABIQIgBEHcAGsiBUHcAG4iBEEDcUEDRwRAQQAgBEEBakEDcWshBANAIAJBxABqIAJBMGooAgA2AgAgAkE8aiACQShqKQIANwIAIAJBNGogAkEgaikCADcCACACQdwAaiECIARBAWoiBA0ACwsgBUGUAkkNAANAIAJBxABqIAJBMGooAgA2AgAgAkE8aiACQShqKQIANwIAIAJBNGogAkEgaikCADcCACACQZABaiACQfwAaikCADcCACACQZgBaiACQYQBaikCADcCACACQaABaiACQYwBaigCADYCACACQewBaiACQdgBaikCADcCACACQfQBaiACQeABaikCADcCACACQfwBaiACQegBaigCADYCACACQdgCaiACQcQCaigC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AUEaai0AACIRIAFBCmotAAAiFCADQf8BcSIDIAMgFEkbIgMgAyARSRsiAyADIBJJGyIDIAMgCkkbIQMgCiASIBEgFCAGQf8BcSIGIAYgFEsbIgYgBiARSxsiBiAGIBJLGyIGIAYgCksbIQYgAUFAayEBIAlBBGsiCQ0ACwsgFgRAIAFBCmohCgNAIAotAAAiASADQf8BcSIDIAEgA0sbIQMgASAGQf8BcSIJIAEgCUkbIQYgCkEQaiEKIARBAWsiBA0ACwsgDEECaiESQf8BIQpBACEEIAtBIGpBAiACQf8BcSIBIAVB/wFxayICQQAgASACTxsiASAHQf8BcSICIABB/wFxayIAQQAgACACTRsiAEsiAiADQf8BcSIDIAZB/wFxayIJQQAgAyAJTxsgASAAIAIbSxtqIQMgCEEgayEBIA5B/v///wFxIQIDQCALIAFBKmotAAA6ACIgCyABQShqLwEAOwAgIAMtAAAhACALIAFBOmotAAA6ACIgCyABQThqLwEAOwAgIAMtAAAiCCAAIARB/wFxIgQgACAESxsiBCAEIAhJGyEEIAggACAKQf8BcSIJIAAgCUkbIgAgACAISxshCiABQSBqIQEgAkECayICDQALIBhBAXFFBEAgCyABLQAqOgAiIAsgAS8BKDsAICADLQAAIgAgBCAAIARLGyEEIAAgCiAAIApJGyEKCyATIBVHBEBBACEJIAQgCmsiAEEAIAAgBE0bIRYgFSATa0EMbiEbA0AgEyAJQQxsaiIAKAIIIgFBAk8EQCABQf////8AaiIcQf////8AcSIBQQFqIg5BA3EhDCAAKAIEIQgCQCABQQNJIhQEQEH/ASEAQQAhByAIIQEMAQsgDkH8////AXEhBEH/ASEAQQAhByAIIQEDQCABQThqLQAAIgMgAUEoai0AACICIAFBGGotAAAiBSABQQhqLQAAIgYgB0H/AXEiByAGIAdLGyIHIAUgB0sbIgcgAiAHSxsiByADIAdLGyEHIAMgAiAFIAYgAEH/AXEiACAAIAZLGyIAIAAgBUsbIgAgACACSxsiACAAIANLGyEAIAFBQGshASAEQQRrIgQNAAsLIAwEQCABQQhqIQUgDCECA0AgBS0AACIBIAdB/wFxIgMgASADSxshByABIABB/wFxIgAgACABSxshACAFQRBqIQUgAkEBayICDQAL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AwAgBUFAayEFIAlBQGshCSAGQQFrIgYNAAshCwtBB0kNACACIBBBBnRqIQQgAyALQQZ0aiEBQQAhCgNAIAkgCmoiBSkDACEsIAVBCGopAwAhLSAFQRBqKQMAIS4gBUEYaikDACEvIAVBIGopAwAhMCAFQShqKQMAITEgBUEwaikDACEyIAEgCmoiA0E4aiAFQThqKQMANwMAIANBMGogMjcDACADQShqIDE3AwAgA0EgaiAwNwMAIANBGGogLzcDACADQRBqIC43AwAgA0EIaiAtNwMAIAMgLDcDACAFQUBrKQMAISwgBUHIAGopAwAhLSAFQdAAaikDACEuIAVB2ABqKQMAIS8gBUHgAGopAwAhMCAFQegAaikDACExIAVB8ABqKQMAITIgA0H4AGogBUH4AGopAwA3AwAgA0HwAGogMjcDACADQegAaiAxNwMAIANB4ABqIDA3AwAgA0HYAGogLzcDACADQdAAaiAuNwMAIANByABqIC03AwAgA0FAayAsNwMAIAVBgAFqKQMAISwgBUGIAWopAwAhLSAFQZABaikDACEuIAVBmAFqKQMAIS8gBUGgAWopAwAhMCAFQagBaikDACExIAVBsAFqKQMAITIgA0G4AWogBUG4AWopAwA3AwAgA0GwAWogMjcDACADQagBaiAxNwMAIANBoAFqIDA3AwAgA0GYAWogLzcDACADQZABaiAuNwMAIANBiAFqIC03AwAgA0GAAWogLDcDACAFQcABaikDACEsIAVByAFqKQMAIS0gBUHQAWopAwAhLiAFQdgBaikDACEvIAVB4AFqKQMAITAgBUHoAWopAwAhMSAFQfABaikDACEyIANB+AFqIAVB+AFqKQMANwMAIANB8AFqIDI3AwAgA0HoAWogMTcDACADQeABaiAwNwMAIANB2AFqIC83AwAgA0HQAWogLjcDACADQcgBaiAtNwMAIANBwAFqICw3AwAgBUGAAmopAwAhLCAFQYgCaikDACEtIAVBkAJqKQMAIS4gBUGYAmopAwAhLyAFQaACaikDACEwIAVBqAJqKQMAITEgBUGwAmopAwAhMiADQbgCaiAFQbgCaikDADcDACADQbACaiAyNwMAIANBqAJqIDE3AwAgA0GgAmogMDcDACADQZgCaiAvNwMAIANBkAJqIC43AwAgA0GIAmogLTcDACADQYAC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AAAgBEEHayAMOgAAIARBCGsgDjoAACAEQQVrIgQgDygAADYAACAEQQRqIA9BBGotAAA6AAALIANBEGohAyAKQQFqIgogBUcNAAsMAQsACyALIAVrIhUgAUsEQCAAIAVBBHQiBGohGiABQQR0IQwgCCgCACgCACIGIAdBCGpqIRAgBkECSyEZQRAhAyACIARqIgUhBANAIAUgAUEEdCIKaiIJIAogGmoiCikDADcDACAJQQhqIg0gCkEIaikDADcDACAHIAktAAoiDjoACiAHIAktAAkiDzoACSAHIA0tAAAiEToACCAZDQIgEC0AACENIAcgCUEGay0AADoACiAHIAlBCGsvAQA7AAggEC0AACANSwRAIApBC2ohEiAJKQMAIRsgAyEKIAQhCQJ/AkADQCAJIAxqIg0gDUEQayITKQMANwMAIA1BCGogE0EIaikDADcDACAKIAxGDQEgByAOOgAKIAcgDzoACSAHIBE6AAggEC0AACAHIA1BFmstAAA6AAogByANQRhrLwEAOwAIIApBEGohCiAJQRBrIQkgEC0AAEkNAAsgCSAMagwBCyAFCyAbNwMAIA1BBmsgDjoAACANQQdrIA86AAAgDUEIayAROgAAIA1BBWsiCSASKAAANgAAIAlBBGogEkEEai0AADoAAAsgA0EQayEDIARBEGohBCABQQFqIgEgFUcNAAsLIAIgCyAAIAgQVgwBCyAGQQNBlOfAABC4AQALIAdBIGokAAuNJAIIfwF+AkACQAJAAkACQAJAIABB9QFPBEAgAEHM/3tLBEBBAA8LIABBC2oiAUF4cSEFQayXwQAoAgAiCEUNBEEfIQdBACAFayEDIABB9P//B00EQCAFQSYgAUEIdmciAGt2QQFxIABBAXRrQT5qIQcLIAdBAnRBkJTBAGooAgAiAkUEQEEAIQFBACEADAILQQAhASAFQRkgB0EBdmtBACAHQR9HG3QhBEEAIQADQAJAIAIoAgRBeHEiBiAFSQ0AIAYgBWsiBiADTw0AIAIhASAGIgMNAEEAIQMgASEADAQLIAIoAhQiBiAAIAYgAiAEQR12QQRxaigCECICRxsgACAGGyEAIARBAXQhBCACDQALDAELAkACQAJAAkACQEGol8EAKAIAIgJBECAAQQtqQfgDcSAAQQtJGyIFQQN2IgB2IgFBA3EEQCABQX9zQQFx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QSBqKQMANwMAIAJBMGoiDyAAQRhqKQMANwMAIAJBKGoiECAEKQMANwMAIAJBIGoiESAFKQMANwMAIAIgACkDADcDGCACKAIUIgUgAigCDEYEQCACQQxqEKwBCyACKAIQIgQgBUE4bGoiACACKQMYNwMAIABBCGogESkDADcDACAAQRBqIBApAwA3AwAgAEEYaiAPKQMANwMAIABBIGogDCkDADcDACAAQShqIAkpAwA3AwAgAEEwaiAIKQMANwMAIAIgBUEBaiIFNgIUIAMhACATIRggFCEXDAkLIABBEGorAwAhEyAWIABBCGorAwAiFKGZRI3ttaD3xrA+Yw0CDAMLIABBMGoiBCsDACETIABBKGoiBSsDACEUIAJByABqIgggBCkDADcDACACQUBrIgkgBSkDADcDACACQThqIgwgAEEgaikDADcDACACQTBqIg8gAEEYaikDADcDACACQShqIhAgAEEQaikDADcDACACQSBqIhEgAEEIaikDADcDACACIAApAwA3AxggAigCFCIFIAIoAgxGBEAgAkEMahCsAQsgAigCECIEIAVBOGxqIgAgAikDGDcDACAAQQhqIBEpAwA3AwAgAEEQaiAQKQMANwMAIABBGGogDykDADcDACAAQSBqIAwpAwA3AwAgAEEoaiAJKQMANwMAIABBMGogCCkDADcDACACIAVBAWoiBTYCFCADIQAMAwsgAigCFCIAIAIoAgxGBEAgAkEMahCsAQsgAigCECIEIABBOGxqQgM3AwAgAiAAQQFqIgU2AhQgAyEAIBYhFCAVIRMMBgsgFSAToZlEje21oPfGsD5jDQMLAkAgBUUEQEEAIQUMAQsgBCkDAEIBUg0AIBQgF6EiGSAZoiATIBihIhogGqKgnyIbRI3ttaD3xrA+YyAWIBehIBqiIBUgGKEgGaKhmSAbo0QtQxzr4jYaP2NyDQILIABBOGohACACKAIMIAVGBEAgAkEMahCsAQsgAigCECIEIAVBOGxqIgMgEzkDECADIBQ5AwggA0IBNwMAIAIgBUEBaiIFNgIUCyAVIRggFiEXDAMLIAkgFDkDACAEQgE3AwAgCCATOQMAIBQhFiATIRULIAMiACAGRw0ACyACKAIUIQUgAigCECEEDAELIAAgBkcNAQsLIAIoAgwhCSAFRQ0BIAVBA3EhA0EAIQhBACEGIAVB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NQIAIAVBBGo1AgBC//8DfnwgBDUCACAEQQRqNQIAQv//A358VCIKGyIHNQIAIQ0gB0EEajUCACEMIAYgAyAEIAobIAkbIgg1AgAhDiAIQQRqNQIAIQ8gAiADIAYgCRspAgA3AgAgAiAHIAggDSAMQv//A358IA4gD0L//wN+fFQiAxspAgA3AgggAiAIIAcgAxspAgA3AhAgAkEYaiIIIAQgBSAKGykCADcCACAAQSBqIgNBEEEYIAA1AjggAEE8ajUCAEL//wN+fCAANQIwIABBNGo1AgBC//8DfnxUIgQbaiIFIAMgADUCKCAAQSxqNQIAQv//A358Ig0gADUCICAAQSRqNQIAQv//A358IgxaQQN0aiIAIANBGEEQIAQbaiIEIAQ1AgAgBEEEajUCAEL//wN+fCADIAwgDVZBA3RqIgNBBGo1AgBC//8DfiADNQIAfFQiCRsgBTUCACAFQQRqNQIAQv//A358IAA1AgAgAEEEajUCAEL//wN+fFQiChsiBjUCACEMIAZBBGo1AgAhDiADIAQgACAKGyAJGyIHNQIAIQ8gB0EEajUCACEQIAJBIGoiCyAEIAMgCRspAgAiDTcCACACQShqIAYgByAMIA5C//8DfnwgDyAQQv//A358VCIEGykCADcCACACQTBqIAcgBiAEGykCADcCACACQThqIgMgACAFIAobKQIAIgw3AgAgASALIAIgDUIgiEL//wN+IA1C/////w+DfCINIAI1AgAgAkEEajUCAEL//wN+fCIOVCIAGykCADcCACABIAsgAEEDdGoiACACIA0gDlpBA3RqIgQgADUCACAAQQRqNQIAQv//A358Ig0gBDUCACAEQQRqNQIAQv//A358Ig5UIgUbKQIANwIIIAEgAkEYQTggDEIgiEL//wN+IAxC/////w+DfCIMIAg1AgAgAkEcajUCAEL//wN+fCIPVCIGG2opAgA3AjggASAIQXhBACAGG2oiAiADQXhBACAMIA9aG2oiAyADNQIAIANBBGo1AgBC//8DfnwiDCACNQIAIAJBBGo1AgBC//8DfnwiD1QiBhspAgA3AjAgASAAIAVBA3RqIgAgBCANIA5aQQN0aiIEIAA1AgAgAEEEajUCAEL//wN+fCINIAQ1AgAgBEEEajUCAEL//wN+fCIOVCIFGykCADcCECABIAJBeEEAIAYbaiICIANBeEEAIAwgD1obaiIDIAM1AgAgA0EEajUCAEL//wN+fCIMIAI1AgAgAkEEajUCAEL//wN+fCIPVCIGGykCADcCKCABIAAgBUEDdGoiACAEIA0gDlpBA3RqIgQgADUCACAAQQRqNQIAQv//A358Ig0gBDUCACAEQQRqNQIAQv//A358Ig5UIgUbKQIANwIYIAEgAkF4QQAgBhtqIgEgA0F4QQAgDCAPWhtqIgIgAjUCACACQQRqNQIAQv//A358IgwgATUCACABQQRqNQIAQv//A358Ig9UIgMbKQIANwIgAkAgBCANIA5aQQN0aiABQXhBACADG2pBCGpGBEAgACAFQQN0aiACQXhBACAMIA9aG2pBCGpGDQELENgBAAsL1QoCCX8FfiAAQRBBGCAANQIYIABBHGo0AgBC//8DfnwgADUCECAAQRRqNAIAQv//A358UyIDG2oiBSAAIAA1AgggAEEMajQCAEL//wN+fCINIAA1AgAgAEEEajQCAEL//wN+fCIMWUEDdGoiBCAAQRhBECADG2oiAyADNQIAIANBBGo0AgBC//8DfnwgACAMIA1VQQN0aiIGQQRqNAIAQv//A34gBjUCAHxTIgkbIAU1AgAgBUEEajQCAEL//wN+fCAENQIAIARBBGo0AgBC//8DfnxTIgobIgc1AgAhDSAHQQRqNAIAIQwgBiADIAQgChsgCRsiCDUCACEOIAhBBGo0AgAhDyACIAMgBiAJGykCADcCACACIAcgCCANIAxC//8DfnwgDiAPQv//A358UyIDGykCADcCCCACIAggByADGykCADcCECACQRhqIgggBCAFIAobKQIANwIAIABBIGoiA0EQQRggADUCOCAAQTxqNAIAQv//A358IAA1AjAgAEE0ajQCAEL//wN+fFMiBBtqIgUgAyAANQIoIABBLGo0AgBC//8DfnwiDSAANQIgIABBJGo0AgBC//8DfnwiDFlBA3RqIgAgA0EYQRAgBBtqIgQgBDUCACAEQQRqNAIAQv//A358IAMgDCANVUEDdGoiA0EEajQCAEL//wN+IAM1AgB8UyIJGyAFNQIAIAVBBGo0AgBC//8DfnwgADUCACAAQQRqNAIAQv//A358UyIKGyIGNQIAIQwgBkEEajQCACEOIAMgBCAAIAobIAkbIgc1AgAhDyAHQQRqNAIAIRAgAkEgaiILIAQgAyAJGykCACINNwIAIAJBKGogBiAHIAwgDkL//wN+fCAPIBBC//8DfnxTIgQbKQIANwIAIAJBMGogByAGIAQbKQIANwIAIAJBOGoiAyAAIAUgChspAgAiDDcCACABIAsgAiANQiCHQv//A34gDUL/////D4N8Ig0gAjUCACACQQRqNAIAQv//A358Ig5TIgAbKQIANwIAIAEgCyAAQQN0aiIAIAIgDSAOWUEDdGoiBCAANQIAIABBBGo0AgBC//8DfnwiDSAENQIAIARBBGo0AgBC//8DfnwiDlMiBRspAgA3AgggASACQRhBOCAMQiCHQv//A34gDEL/////D4N8IgwgCDUCACACQRxqNAIAQv//A358Ig9TIgYbaikCADcCOCABIAhBeEEAIAYbaiICIANBeEEAIAwgD1kbaiIDIAM1AgAgA0EEajQCAEL//wN+fCIMIAI1AgAgAkEEajQCAEL//wN+fCIPUyIGGykCADcCMCABIAAgBUEDdGoiACAEIA0gDllBA3RqIgQgADUCACAAQQRqNAIAQv//A358Ig0gBDUCACAEQQRqNAIAQv//A358Ig5TIgUbKQIANwIQIAEgAkF4QQAgBhtqIgIgA0F4QQAgDCAPWRtqIgMgAzUCACADQQRqNAIAQv//A358IgwgAjUCACACQQRqNAIAQv//A358Ig9TIgYbKQIANwIoIAEgACAFQQN0aiIAIAQgDSAOWUEDdGoiBCAANQIAIABBBGo0AgBC//8DfnwiDSAENQIAIARBBGo0AgBC//8DfnwiDlMiBRspAgA3AhggASACQXhBACAGG2oiASADQXhBACAMIA9ZG2oiAiACNQIAIAJBBGo0AgBC//8DfnwiDCABNQIAIAFBBGo0AgBC//8DfnwiD1MiAxspAgA3AiACQCAEIA0gDllBA3RqIAFBeEEAIAMbakEIakYEQCAAIAVBA3RqIAJBeEEAIAwgD1kbakEIakYNAQsQ2AEACwviCgIafwF+IwBBQGoiBCQAAkACQAJAIAAoAggiDA4CAgEACyAAKAIEIg0oAiAhEiAMQQJ0IhAQDSIHBEAgDEEDcSEGIAxBAWtBA08EQCANQewAaiECIAxB/P//H3EhCiAHIQMDQCADQQxqIAI2AgAgA0EIaiACQSRrNgIAIANBBGogAkHIAGs2AgAgAyAC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SSIBGygCADYCACAGIAAgA09BAnRqIQYgACABQQJ0agUgAAsgA0YgBiAIQQRqRnENBBDYAQALIAQgBUGk58AAELgBAAsgByAFQaTnwAAQuAEACyAEIAVBpOfAABC4AQALIAcgBUGk58AAELgBAAsLhwQBAX8jAEEQayICJAACfwJAAkACQAJAAkAgACgCAEEBaw4EAwAEAQILIAIgAEEEajYCBCACIAJBBGqtQoCAgIAwhDcDCCABQbikwABB14PAACACQQhqEFQMBAsgAiAAQQRqNgIEIAIgAkEEaq1CgICAgDCENwMIIAFBuKTAAEHrg8AAIAJBCGoQVAwDCyABKAIAIAEoAggiAGtBE00EQCABIABBFBCZASABKAIIIQALIAEgAEEUajYCCCABKAIEIABqIgFBnNvAACkAADcAACABQQhqQaTbwAApAAA3AAAgAUEQakGs28AAKAAANgAAQQAMAgsgASgCACABKAIIIgBrQTRNBEAgASAAQTUQmQEgASgCCCEACyABIABBNWo2AgggASgCBCAAaiIBQbDbwAApAAA3AAAgAUEIakG428AAKQAANwAAIAFBEGpBwNvAACkAADcAACABQRhqQcjbwAApAAA3AAAgAUEgakHQ28AAKQAANwAAIAFBKGpB2NvAACkAADcAACABQS1qQd3bwAApAAA3AABBAAwBCyABKAIAIAEoAggiAGtBE00EQCABIABBFBCZASABKAIIIQALIAEgAEEUajYCCCABKAIEIABqIgFB5dvAACkAADcAACABQQhqQe3bwAApAAA3AAAgAUEQakH128AAKAAANgAAQQALIAJBEGokAAuyDwISfwV+IAApAxAiFiAAKQMYIhcgASACEFshGCAAKAIIRQRAAkACQAJAIAAoAgwiCUEBaiIDBEACQCAAKAIEIgggCEEBaiIEQQN2IgVBB2wgCEEISRsiDUEBdiADSQRAIA1BAWoiBCADIAMgBEkbIgNBD0kNASADQf////8BTQRAQX8gA0EDdEEHbkEBa2d2IgNB/v///wFLDQUgA0EBaiEHDAQLDAQLIAQEQCAAKAIAIQYCQCAFIARBB3FBAEdqIgNBAUcEQCADQQFxIANB/v///wNxIQMDQCAGIAdqIgUgBSkDACIVQn+FQgeIQoGChIiQoMCAAYMgFUL//v379+/fv/8AhHw3AwAg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cxsLgAEBAn8gA0EITwRAIAAgACADQQN2IgNBBHQiBGogACADQRxsIgVqIAMQlwEhACABIAEgBGogASAFaiADEJcBIQEgAiACIARqIAIgBWogAxCXASECCyAAIAIgASAAKAIAIgAgASgCACIBSSIDIAEgAigCACICSXMbIAMgACACSXMbC4ABAQJ/IANBCE8EQCAAIAAgA0EDdiIDQQR0IgRqIAAgA0EcbCIFaiADEJgBIQAgASABIARqIAEgBWogAxCYASEBIAIgAiAEaiACIAVqIAMQmAEhAgsgACACIAEgACgCACIAIAEoAgAiAUkiAyABIAIoAgAiAklzGyADIAAgAklzGwvsAQEEfyMAQRBrIgMkACACIAEgAmoiBEsEQEEAQQAQzQEACyADQQRqIQEgACgCACICIQUgACgCBCEGAkBBCCAEIAJBAXQiAiACIARJGyICIAJBCE0bIgJBAEgEQCABQQA2AgQgAUEBNgIADAELAn8gBQRAIAYgBUEBIAIQPgwBCyACEA0LIgRFBEAgASACNgIIIAFBATYCBCABQQE2AgAMAQsgASACNgIIIAEgBDYCBCABQQA2AgALIAMoAgRBAUYEQCADKAIIIAMoAgwQzQEACyADKAIIIQEgACACNgIAIAAgATYCBCADQRBqJAAL5gEBBX8jAEEQayIDJAAgAiABIAJqIgFLBEBBAEEAEM0BAAsgA0EEaiEFIAAoAgQhBkEAIQICf0EIIAEgACgCACIEQQF0IgcgASAHSxsiASABQQhNGyIBQQBIBEBBASEEQQQMAQsCfwJ/IAQEQCAGIARBASABED4MAQsgARANCyICRQRAIAVBATYCBEEBDAELIAUgAjYCBEEACyEEIAEhAkEICyAFaiACNgIAIAUgBDYCACADKAIEQQFGBEAgAygCCCADKAIMEM0BAAsgAygCCCECIAAgATYCACAAIAI2AgQgA0EQaiQAC2oBA38jAEEQayICJAAgAC0AACEDQQMhAANAIAAgAmpBDGogA0EPcUHeqMAAai0AADoAACADIgRBBHYhAyAAQQFrIQAgBEEPSw0ACyABQdyowABBAiAAIAJqQQ1qQQMgAGsQVSACQRBqJAALYgEEfiAAIAJC/////w+DIgMgAUL/////D4MiBH4iBSAEIAJCIIgiAn4iBCADIAFCIIgiBn58IgFCIIZ8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IgdqIgMgC08gAyARckEASHINASAGIAIgByALIBFsamoiA0sEQCAVIANBAnRqIAo2AgAMAgsgAyAGQbTrwAAQuAEAC0GUv8AAENYBAAsgBCACQQFqIgJHDQALCyANQQFqIg0gCEYNASAAKAIQIQQMAAsACyAKQQFqIQogAEEkaiIAIBBHDQALIAUhBwsgE0GAAWohNyASIA82AiQgEiALNgIgIBIgBzYCHCASIAw2AhggEiAJNgIUIBIgBjYCECASIBU2AgwgEiAXNgIIAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkAgH0EASCAHQQJJckUEQCAHQf////8ASwRAQQBBABDNAQALIAdBA3QiAhANIgBFBEBBCCACEM0BAAsgAEEEay0AAEEDcUUgAkVyRQRAIABBACAC/AsACyASIAc2AjwgEiAANgI4IBIgBzYCNCAGBEAgBkECdCECA0ACQCAVKAIAIgNBf0YNACASKAI8IgAgA0sEQCASKAI4IANBA3RqIgAgACkDAEIBfDcDAAwBCyADIABBxOnAABC4AQALIBVBBGohFSACQQRrIgINAAsLIAdBGGwhACAHQdWq1SpLBEBBACAAEM0BAAtBACECAkAgAEUEQEEIIQRBACELDAELIAchCyAAEA0iBA0AQQggABDNAQALAkACQAJAAkAgEiAHBH9BACEQIAQhAEEBIQMDQCACIBIoAhwiBk8NAiACIBIoAjwiBk8NAyASKAIYIANqIgZBAWsxAAAhSSAGQQFqMQAAIUggAEEIaiASKAI4IBBqKQMAIkogBjEAAH43AwAgAEEQaiBIIEp+NwMAIAAgSSBKfjcDACAAQRhqIQAgEEEIaiEQIANBBGohAyAFIAJBAWoiAkcNAAsgBQVBAAs2ArgBIBIgBDYCtAEgEiALNgKwASASKAIgIQsgEigCJCEKIBJCgICAgMAANwLIASASQQA2AtABQfiXwQAtAABFBEAQsQELIBJB2ABqQYjswAApAwA3AwBB6JfBAEHol8EAKQMAIkhCAXw3AwAgEkGA7MAAKQMANwNQIBJB8JfBACkDADcDaCASIEg3A2AgCkEATCALQQBMcg0CQQAhFUEEIRlBASEGQQAhDQJAAkACQANAIA1BAWohA0EAIQADQCAAIgJBAWohAAJAIAIgEigCICIETw0AIA0gEigCJE8NACAC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EiAFNgJkIBIgEDYCYCASIAI2AlwgEiAPNgKUASASIBJBCGo2AowBQQQhBAJAIA9BAEgNAAJAIAtBAE4EQCASQfQAaiEDQQAhEAwBC0EAIQADQCAAIA9ODQIgACAAIA9IaiIAIA9MDQALDAELA0ACQCALQQBIDQBBACEAA0ACQCASKAKMASAAIBAQYkH/AXFpQQJNDQAgEigCfCIFIBIoAnRGBEAgAxCrAQsgEigCeCAFQShsaiICIBA2AiQgAiAANgIgIAJBAjoAHCACQQI6ABQgAkECOgAMIAJBAjoABCASIAVBAWo2AnwgEigCkAFBAWogEGwgAGoiBCASKAJYIgJJBEAgEigCVCAEQQJ0aiAFNgIADAELIAQgAkG06cAAELgBAAsgACALTg0BIAAgACALSGoiACALTA0ACwsCQCAPIBBMDQAgECAPIBBKaiIQIA9KDQAgEigCkAEhCwwBCwsgEigCfCEDIBIoAnghBAsCQCADQf////8BSyADQQN0IgBB/P///wdLcgR/QQAFIABFBEBBACEJQQQhBwwCCyADIQkgABANIgcNAUEECyAAEM0BAAsgAwRAIANBA3EhEEEAIQggA0EETwRAIANB/P///wFxIQUgByEAIAQhAgNAIAAgAkEgaikCADcCACAAQQhqIAJByABqKQIANwIAIABBEGogAkHwAGopAgA3AgAgAEEYaiACQZgBaikCADcCACAAQSBqIQAgAkGgAWohAiAFIAhBBGoiCEcNAAsLIBAEQCAHIAhBA3RqIQAgCEEobCAEakEkaiECA0AgACACQQRrKQIANwIAIAJBKGohAiAAQQhqIQAgEEEBayIQDQALCyASQewAaiEIIBJB4ABqIQYgByADQQN0aiEhIBJBgAFqIRlBBCEMIAchDUEAIQUDQCASKAKMASANKAIAIiIgDSgCBCIYEGJB/wFxISAgBSIRQQFqIQUgDUEIaiENIBhBAWsiFSAiQQFrIhxyQQBIIRsgFSAickEASCEeIBggHHJBAEghHyAYICJyQQBIIRcgDCEQQQAhAAJAAkACQAJAAkACQANAAkACQCAgIAB2QQFxRQ0AIBIoApABIQIgGCEDAkACQAJAAkACQAJ/AkACQCAAQQFrDgMABAEDCyACIBhsICJqDAELIBwgAiAYbGoLIQIgAiASKAJwIgNPDQIgCCEDDAQL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ACALTyACIApPckUEQCACIAtsIABqIgogDCgCCCILTw0QIAwoAgQgCkECdGooAgAhEAsgEkGYAWogEkHQAGogACACQQEQTCASQdABaiIDIBJBoAFqKAIANgIAIBIgEikCmAE3A8gBIBIoAogBIgUgEigCgAFGBEAgCBCrAQsgEigChAEgBUEobGoiBkEANgIIIAZBADYCACAGIBIpA8gBNwIQIAZBATsBJCAGIBA2AiAgBiAENgIcIAZBGGogAygCADYCACASIAVBAWo2AogBCwJAIAdBBHFFDQAgEigCkAFBAWogAmwgAGoiBCASKAJkIgtPDQEgEigCYCAEai0AAA0AIBIoAowBIQwCQAJAAkAgESAVckEASA0AIBEgDCgCGCILTw0AIBUgDCgCHCIQTw0AIAsgFWwgEWoiCiAMKAIIIgZJDQEMEQsgDCgCGCELIAJFDQEgDCgCHCEQCyAQIBVNIAAgC09yDQAgCyAVbCAAaiIKIAwoAggiBk8NDwsCfyAARQRAIAwoAhwhCkF/DAELQX8gCyARTSAMKAIcIgogAk1yDQAaIAIgC2wgEWoiAyAMKAIIIgVPDRQgDCgCBCADQQJ0aigCAAshBEF/IRAgACALTyACIApPckUEQCACIAtsIABqIgogDCgCCCILTw0QIAwoAgQgCkECdGooAgAhEAsgEkGYAWogEkHQAGogACACQQIQTCASQdABaiIDIBJBoAFqKAIANgIAIBIgEikCmAE3A8gBIBIoAogBIgUgEigCgAFGBEAgCBCrAQsgEigChAEgBUEobGoiBkEANgIIIAZBADYCACAGIBIpA8gBNwIQIAZBAjsBJCAGIAQ2AiAgBiAQNgIcIAZBGGogAygCADYCACASIAVBAWo2AogBCwJAIAdBCEkNACASKAKQASACbCARaiIEIBIoAnAiC08NAyASKAJsIARqLQAADQAgEigCjAEhBQJAAn8CQCARIBVyQQBIDQAgESAFKAIYIgRPDQAgFSAFKAIcIgtPDQAgBCAVbCARaiIKIAUoAggiBkkEQCAFKAIEIApBAnRqKAIADAILDBELIAUoAhghBCACRQRAQX8hDwwCCyAFKAIcIQtBfwshDyALIBVNIAAgBE9yDQAgBCAVbCAAaiIKIAUoAggiC08NEAsCfyAARQRAIAUoAhwhEEF/DAELQX8gBCARTSAF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AgggJSgCDCAlQRBqJAALTAEBfyAAKAIAIAAoAggiA2sgAkkEQCAAIAMgAkEBQQEQlAEgACgCCCEDCyACBEAgACgCBCADaiABIAL8CgAACyAAIAIgA2o2AghBAAtDAQN/AkAgAkUNAANAIAAtAAAiBCABLQAAIgVGBEAgAEEBaiEAIAFBAWohASACQQFrIgINAQwCCwsgBCAFayEDCyADC0gBAX8gACgCACAAKAIIIgNrIAJJBEAgACADIAIQmQEgACgCCCEDCyACBEAgACgCBCADaiABIAL8CgAACyAAIAIgA2o2AghBAAtIAQF/IAAoAgAgACgCCCIDayACSQRAIAAgAyACEJoBIAAoAgghAwsgAgRAIAAoAgQgA2ogASAC/AoAAAsgACACIANqNgIIQQALRwAgAigCAEEBRgRAIABBBGogASsDACABKwMIIAJBBGpBABALIABBATYCAA8LIAAgAikCADcCACAAQQhqIAJBCGopAgA3AgALRwAgAigCAEEBRgRAIABBBGogASsDACABKwMIIAJBBGpBARALIABBATYCAA8LIAAgAikCADcCACAAQQhqIAJBCGopAgA3AgALQgACQAJAIAFpQQFHIABBgICAgHggAWtLcg0AIABFDQEgAUEJTwRAIAEgABBtIgFFDQEMAgsgABANIgENAQsACyABC65pAx5/FX4BfCABKAIIIgJBgICAAXEhBSAAKwMAITUCQAJAAkAgAkGAgICAAXFFBEACfyABIRIgBUEARyEMIwBBgAtrIgQkAEIBIS4gNb0iJkL/////////B4MiIEKAgICAgICACIQgJkIBhkL+////////D4MgJkI0iKdB/w9xIgEbIilCAYMhJUECIRMCQAJAAkACQAJ/AkACfwJAAkACQAJAAkAgIFAiAEECQQMgABtBBCAmQoCAgICAgID4/wCDIiBQGyAgQoCAgICAgID4/wBRG0EBaw4EAgAEAQMLQQQhEwwCC0KAgICAgICAICApQgGGIClCgICAgICAgAhRIgAbISlCAkIBIAAbIS5By3dBzHcgABsgAWohASAlUAwDC0EDIRMLICZCP4inIQAMAgsgAUGzCGshASAlUAshACAmQj+IISggAMAhEyAAQf8BcUEBSwRAICinIQAMAQsCQAJAAkAgKVBFBEAgBCApQgF9IiU3A9gJIAQgJSApIC58IjJ5IieGIiEgJ4giIDcDsAggBCABOwHgCSAgICVSDQYgBCABOwHgCSAEICk3A9gJIAQgKSAnhiIlICeIIiA3A7AIICAgKVINBiABICenayICQbB/bEGw6wRqQc4QbSIFQdAASw0CQciowABBASAmQgBTIgAbIQ1ByKjAAEHLqMAAIAAbIQcgKKchCSAEQTBqIAVBBHQiACkDgKxAIiAgMiAnhhCcASAEQSBqICAgIRCcASAEQRBqICAgJRCcAUIBQQAgAiAALwGIrEBqa0E/ca0iIoYiLEIBfSEjIAQpAyBCP4chJiAEKQMQQj+IITMgBCkDGCE0IAAvAYqsQCELIAQpAyghJyAEKQM4IiogBCkDMEI/iCIrfCIwQgF8Ii0gIoinIgBBkM4ATwRAIABBwIQ9SQ0CIABBgMLXL08EQEEIQQkgAEGAlOvcA0kiAhshBUGAwtcvQYCU69wDIAIbIQMMBQtBBkEHIABBgK3iBEkiAhshBUHAhD1BgK3iBCACGyEDDAQLIABB5ABPBEBBAkEDIABB6AdJIgIbIQVB5ABB6AcgAhshAwwEC0EKQQEgAEEJSyIFGyEDDAMLQcC2wABBHEGct8AAEM4BAAtBBEEFIABBoI0GSSICGyEFQZDOAEGgjQYgAhshAwwBCyAFQdEAQey2wAAQuAEACyAHIA0gDBshGkEBIAkgDBshGSAjIC2DISEgMyA0fCEvIAUgC2tBAWohFCAmICd9IC18QgF8IjEgI4MhJQJAAkACQAJAAkACQAJAAkACQANAIARBxwBqIAhqIAAgA24iAkEwaiIJOgAAIDEgACACIANsayIArSAihiIkICF8IiBWDQIgBSAIRgRAIAhBAWohBUIBISADQCAgISggBUERRg0FIARBxwBqIAVqICFCCn4iISAiiKdBMGoiAzoAACAFQQFqIQUgIEIKfiEgICVCCn4iJSAhICODIiFYDQALICUgIX0iJyAsVCEIICAgLSAvfX4iIiAgfCEjICEgIiAgfSIqWg0HICcgLFoNAgwHCyAIQQFqIQggA0EKSSADQQpuIQNFDQALQay3wAAQ1wEACyAEIAVqQcYAaiEAICwgL0IKfiAwQgp+fSAofnwhKyAlICx9ISZCACAhfSEiA0AgISAsfCIgICpUICIgKnwgISArfFpyRQRAQQAhCAwGCyAAIANBAWsiAzoAACAiICZ8IicgLFQhCCAgICpaDQYgIiAsfSEiICAhISAnICxaDQALDAULIAhBAWohBSAxICB9IiggA60gIoYiIlQhAyAtIC99IiVCAXwhLSAiIChWICAgJUIBfSIjWnINASAEIAVqQcYAaiEAICYgMHwgJ30gISAifCAkfH1CAnwhJiAwIC99ICB9IScgISAzfCA0fCArfSAqfSAkfCErQgAhIQNAICAgInwiJSAjVCAhICd8ICIgK3xackUEQEEAIQMMAwsgACAJQQFrIgk6AAAgISAmfCIoICJUIQMgIyAlWA0DICIgK3whKyAhICJ9ISEgJSEgICIgKFgNAAsMAgtBEUERQby3wAAQuAEACyAgISULICUgLVogA3JFBEAgIiAlfCIhIC1UIC0gJX0gISAtfVpyDQMLICVCAlQgJSAxQgR9VnINAgwDCyAhISALAkAgCEUgICAjVHFFBEAgKEIUfiAgWA0BDAILICAgLHwiISAjVCAjICB9ICEgI31aciAoQhR+ICBWcg0BCyAgICUgKEJYfnxYDQELAkACQAJAIClCf4UgLloEQCAEICk+AlggBEEBQQIgKUKAgICAEFQiABs2AvgBIARBACApQiCIpyAAGzYCXCAEQeAAakEAQZgB/AsAIARBATYC/AEgBEEBNgKcAyAEQYACakEAQZwB/AsAIARBATYCwAQgBCAuPgKgAyAEQaQDakEAQZwB/AsAIARByARqQQBBnAH8CwAgBEEBNgLEBCAEQQE2AuQFIAGsIDJCAX15fULCmsHoBH5CgKHNoLQCfEIgiKciAMEhFAJAIAFBAE4EQCAEQdgAaiABEFMaIARB/AFqIAEQUxogBEGgA2ogARBTGgwBCyAEQcQEakEAIAFrEFMaCwJAIBRBAEgEQCAEQdgAakEAIBRrQf//A3EiABAxIARB/AFqIAAQMSAEQaADaiAAEDEMAQsgBEHEBGogAEH//wFxEDELIARB2AlqIARB2ABqQaQB/AoAACAEKALABCIAIAQoAvgKIgEgACABSxsiAUEoTQRAAkAgAUUEQEEAIQEMAQtBACEJQQAhBwJAAkAgAUEBRwRAIAFBAXEgAUE+cSEMIARB2AlqIQMgBEGgA2ohCANAIAMgCCgCACINIAMoAgBqIg4gB0EBcWoiCzYCACADQQRqIgIgCEEEaigCACIFIAIo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BGsiAyAEQcQEamooAgAiAEYNAAsgACABSw0IDAcLQQAgEEEoQbSqwAAQfAALQRFBEUH0uMAAELgBAAsgBEHEBGoiACAAIANqRw0FDAQLDA8LDAkLDA8LQcy3wABBNkGkucAAEM4BAAsgBEHHAGogBWohASAFIQMCQANAIAMiAEUNASAAQQFrIgMgBEHHAGoiAmotAABBOUYNAAsgAiADaiIBIAEtAABBAWo6AAAgBSAAayIBRQ0BIAAgAmpBMCAB/AsADAELIARBMToARyALBEAgBEHIAGpBMCAL/AsACyALQQ9NBEAgAUEwOgAAIBRBAWohFCALQQJqIQUMAwsgBUERQYS5wAAQuAEACyALQRBNDQFBACAFQRFBlLnAABB8AAsMBgsgBEEIaiAEQccAaiAFIBRBACAEQdgJahB0IAQoAgwhAyAEKAIIDAELAkAgE0ECRwRAIARBAjsB2AlBASEDQciowABBy6jAACAAG0HIqMAAQQEgABsgDBshGiAmQj+IpyAMciEZIBNBBEYNASAEQQM2AuAJIARB5KrAADYC3AkgBEHYCWoMAgsgBEEDNgLgCSAEQeGqwAA2AtwJIARBAjsB2AlBASEaQQEhAyAEQdgJagwBCyAEQQE2AuAJIARByajAADYC3AkgBEHYCWoLIQAgBCADNgK8CCAEIAA2ArgIIAQgGTYCtAggBCAaNgKwCCASIARBsAhqEFEgBEGAC2okAAwECyMAQRBrIgAkACAAIARB2AlqNgIMIAAgBEGwCGo2AggjAEEwayIBJAAgAUHkvMAANgIEIAEgAEEIajYCACABQeS8wAA2AgwgASAAQQxqNgIIIAFBAjYCFCABQfS8wAA2AhAgASABQQhqrUKAgICA4ACENwMoIAEgAa1CgICAgOAAhDcDICABIAFBEGqtQoCAgIDwAIQ3AxhB34LAACABQRhqQfi6wAAQwwEAC0EAIAhBKEG0qsAAEHwAC0EoQShBtKrAABC4AQALQZiqwABBGkG0qsAAEM4BAAsPCwJ/IAEhAyAFQQBHIRcgAS8BDiETQQAhACMAQeAOayIGJABCASEnIDW9IipC/////////weDIiBCgICAgICAgAiEICpCAYZC/v///////w+DICpCNIinQf8PcSIFGyIkQgGDISVBAiECAkACQAJ/AkACfwJ/AkACQAJAAkACQCAg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IHN0YXJ0IGluZGV4IMAiIG91dCBvZiByYW5nZSBmb3Igc2xpY2Ugb2YgbGVuZ3RoIMAAEHJhbmdlIGVuZCBpbmRleCDAIiBvdXQgb2YgcmFuZ2UgZm9yIHNsaWNlIG9mIGxlbmd0aCDAABVpbmRleCBvdXQgb2YgYm91bmRzOiDABCA+PSDAABBhc3NlcnRpb24gYGxlZnQgwBcgcmlnaHRgIGZhaWxlZAogIGxlZnQ6IMAJCiByaWdodDogwAAWdW5rbm93biBoaWVyYXJjaGljYWw6IMAAFHVua25vd24gY29sb3JfbW9kZTogwAAOdW5rbm93biBtb2RlOiDAAA11bnN1cHBvcnRlZDogwADAAjogwAAvcnVzdGMvNGE0ZWY0OTNlM2ExNDg4YzZlMzIxNTcwMjM4MDg0YjM4OTQ4ZjZkYi9saWJyYXJ5L2FsbG9jL3NyYy9jb2xsZWN0aW9ucy9idHJlZS9tYXAvZW50cnkucnMAL3JlZ2lzdHJ5L3NyYy9pbmRleC5jcmF0ZXMuaW8tMTk0OWNmOGM2YjViNTU3Zi92aXNpb25jb3J0ZXgtMC45LjMvc3JjL3BhdGgvc2ltcGxpZnkucnMAL3JlZ2lzdHJ5L3NyYy9pbmRleC5jcmF0ZXMuaW8tMTk0OWNmOGM2YjViNTU3Zi92dHJhY2VyLTEuMC4wLWFscGhhLjQvc3JjL3NpbXBsaWZ5LnJzAC9ydXN0Yy80YTRlZjQ5M2UzYTE0ODhjNmUzMjE1NzAyMzgwODRiMzg5NDhmNmRiL2xpYnJhcnkvY29yZS9zcmMvbnVtL2ZsdDJkZWMvc3RyYXRlZ3kvZ3Jpc3UucnMAL3J1c3RjLzRhNGVmNDkzZTNhMTQ4OGM2ZTMyMTU3MDIzODA4NGIzODk0OGY2ZGIvbGlicmFyeS9jb3JlL3NyYy9zbGljZS9zb3J0L3NoYXJlZC9zbWFsbHNvcnQucnMAL3J1c3RjLzRhNGVmNDkzZTNhMTQ4OGM2ZTMyMTU3MDIzODA4NGIzODk0OGY2ZGIvbGlicmFyeS9jb3JlL3NyYy9zbGljZS9zb3J0L3N0YWJsZS9xdWlja3NvcnQucnMAL3J1c3RjLzRhNGVmNDkzZTNhMTQ4OGM2ZTMyMTU3MDIzODA4NGIzODk0OGY2ZGIvbGlicmFyeS9hbGxvYy9zcmMvZm10LnJzAC9yZWdpc3RyeS9zcmMvaW5kZXguY3JhdGVzLmlvLTE5NDljZjhjNmI1YjU1N2YvZmxvX2N1cnZlcy0wLjMuMS9zcmMvYmV6aWVyL2ZpdC5ycwAvcmVnaXN0cnkvc3JjL2luZGV4LmNyYXRlcy5pby0xOTQ5Y2Y4YzZiNWI1NTdmL2Zsb19jdXJ2ZXMtMC44LjAvc3JjL2Jlemllci9maXQucnMAL3JlZ2lzdHJ5L3NyYy9pbmRleC5jcmF0ZXMuaW8tMTk0OWNmOGM2YjViNTU3Zi92dHJhY2VyLTEuMC4wLWFscGhhLjQvc3JjL21vc2FpYy9maXQucnMAL3JlZ2lzdHJ5L3NyYy9pbmRleC5jcmF0ZXMuaW8tMTk0OWNmOGM2YjViNTU3Zi92aXNpb25jb3J0ZXgtMC45LjMvc3JjL2ltYWdlL3NhdC5ycwAvcnVzdGMvNGE0ZWY0OTNlM2ExNDg4YzZlMzIxNTcwMjM4MDg0YjM4OTQ4ZjZkYi9saWJyYXJ5L2NvcmUvc3JjL251bS9kaXlfZmxvYXQucnMAL3JlZ2lzdHJ5L3NyYy9pbmRleC5jcmF0ZXMuaW8tMTk0OWNmOGM2YjViNTU3Zi92aXNpb25jb3J0ZXgtMC45LjMvc3JjL2ltYWdlL2Zvcm1hdC5ycwAvcmVnaXN0cnkvc3JjL2luZGV4LmNyYXRlcy5pby0xOTQ5Y2Y4YzZiNWI1NTdmL3Zpc2lvbmNvcnRleC0wLjkuMy9zcmMvY2x1c3RlcnMucnMAL3JlZ2lzdHJ5L3NyYy9pbmRleC5jcmF0ZXMuaW8tMTk0OWNmOGM2YjViNTU3Zi92aXNpb25jb3J0ZXgtMC45LjMvc3JjL3BhdGgvcGF0aHMucnMAL3JlZ2lzdHJ5L3NyYy9pbmRleC5jcmF0ZXMuaW8tMTk0OWNmOGM2YjViNTU3Zi92aXNpb25jb3J0ZXgtMC45LjMvc3JjL2NvbG9yLnJzAC9yZWdpc3RyeS9zcmMvaW5kZXguY3JhdGVzLmlvLTE5NDljZjhjNmI1YjU1N2YvdnRyYWNlci0xLjAuMC1hbHBoYS40L3NyYy9maXR0ZXIucnMAL3JlZ2lzdHJ5L3NyYy9pbmRleC5jcmF0ZXMuaW8tMTk0OWNmOGM2YjViNTU3Zi92aXNpb25jb3J0ZXgtMC45LjMvc3JjL2NvbG9yX2NsdXN0ZXJzL2NsdXN0ZXIucnMAL3JlZ2lzdHJ5L3NyYy9pbmRleC5jcmF0ZXMuaW8tMTk0OWNmOGM2YjViNTU3Zi92aXNpb25jb3J0ZXgtMC45LjMvc3JjL2NvbG9yX2NsdXN0ZXJzL3J1bm5lci5ycwAvcmVnaXN0cnkvc3JjL2luZGV4LmNyYXRlcy5pby0xOTQ5Y2Y4YzZiNWI1NTdmL3Zpc2lvbmNvcnRleC0wLjkuMy9zcmMvY29sb3JfY2x1c3RlcnMvY29udGFpbmVyLnJzAC9yZWdpc3RyeS9zcmMvaW5kZXguY3JhdGVzLmlvLTE5NDljZjhjNmI1YjU1N2YvdmlzaW9uY29ydGV4LTAuOS4zL3NyYy9wYXRoL3dhbGtlci5ycwAvcmVnaXN0cnkvc3JjL2luZGV4LmNyYXRlcy5pby0xOTQ5Y2Y4YzZiNWI1NTdmL3Zpc2lvbmNvcnRleC0wLjkuMy9zcmMvY29sb3JfY2x1c3RlcnMvYnVpbGRlci5ycwAvcnVzdGMvNGE0ZWY0OTNlM2ExNDg4YzZlMzIxNTcwMjM4MDg0YjM4OTQ4ZjZkYi9saWJyYXJ5L2NvcmUvc3JjL251bS9mbHQyZGVjL3N0cmF0ZWd5L2RyYWdvbi5ycwAvcnVzdGMvNGE0ZWY0OTNlM2ExNDg4YzZlMzIxNTcwMjM4MDg0YjM4OTQ4ZjZkYi9saWJyYXJ5L2NvcmUvc3JjL251bS9iaWdudW0ucnMAL3JlZ2lzdHJ5L3NyYy9pbmRleC5jcmF0ZXMuaW8tMTk0OWNmOGM2YjViNTU3Zi92aXNpb25jb3J0ZXgtMC45LjMvc3JjL3BhdGgvc21vb3RoLnJzAC9yZWdpc3RyeS9zcmMvaW5kZXguY3JhdGVzLmlvLTE5NDljZjhjNmI1YjU1N2YvdnRyYWNlci0xLjAuMC1hbHBoYS40L3NyYy9tb3NhaWMvZ3JhcGgucnMAL3JlZ2lzdHJ5L3NyYy9pbmRleC5jcmF0ZXMuaW8tMTk0OWNmOGM2YjViNTU3Zi92dHJhY2VyLTEuMC4wLWFscGhhLjQvc3JjL3N2Zy5ycwAvcnVzdGMvNGE0ZWY0OTNlM2ExNDg4YzZlMzIxNTcwMjM4MDg0YjM4OTQ4ZjZkYi9saWJyYXJ5L2FsbG9jL3NyYy9zdHJpbmcucnMAL3JlZ2lzdHJ5L3NyYy9pbmRleC5jcmF0ZXMuaW8tMTk0OWNmOGM2YjViNTU3Zi93YXNtLWJpbmRnZW4tMC4yLjEyNi9zcmMvZXh0ZXJucmVmLnJzAC9yZWdpc3RyeS9zcmMvaW5kZXguY3JhdGVzLmlvLTE5NDljZjhjNmI1YjU1N2YvdnRyYWNlci0xLjAuMC1hbHBoYS40L3NyYy9jb2xvcmZpdC9xdWFudGl6ZS5ycwAvcmVnaXN0cnkvc3JjL2luZGV4LmNyYXRlcy5pby0xOTQ5Y2Y4YzZiNWI1NTdmL3Z0cmFjZXItMS4wLjAtYWxwaGEuNC9zcmMvY29sb3JmaXQvcGFsZXR0ZS5ycwAvcnVzdGMvNGE0ZWY0OTNlM2ExNDg4YzZlMzIxNTcwMjM4MDg0YjM4OTQ4ZjZkYi9saWJyYXJ5L2FsbG9jL3NyYy9jb2xsZWN0aW9ucy9idHJlZS9uYXZpZ2F0ZS5ycwAvcmVnaXN0cnkvc3JjL2luZGV4LmNyYXRlcy5pby0xOTQ5Y2Y4YzZiNWI1NTdmL3Z0cmFjZXItMS4wLjAtYWxwaGEuNC9zcmMvbW9zYWljL2NvbXBvc2UucnMAL3JlZ2lzdHJ5L3NyYy9pbmRleC5jcmF0ZXMuaW8tMTk0OWNmOGM2YjViNTU3Zi92aXNpb25jb3J0ZXgtMC45LjMvc3JjL3BhdGgvc3BsaW5lLnJzAC9ydXN0Yy80YTRlZjQ5M2UzYTE0ODhjNmUzMjE1NzAyMzgwODRiMzg5NDhmNmRiL2xpYnJhcnkvYWxsb2Mvc3JjL2NvbGxlY3Rpb25zL2J0cmVlL25vZGUucnMAL3JlZ2lzdHJ5L3NyYy9pbmRleC5jcmF0ZXMuaW8tMTk0OWNmOGM2YjViNTU3Zi92dHJhY2VyLTEuMC4wLWFscGhhLjQvc3JjL21vc2FpYy9mYWNlLnJzAC9ydXN0L2RlcHMvaGFzaGJyb3duLTAuMTYuMS9zcmMvcmF3L21vZC5ycwAvcnVzdGMvNGE0ZWY0OTNlM2ExNDg4YzZlMzIxNTcwMjM4MDg0YjM4OTQ4ZjZkYi9saWJyYXJ5L2NvcmUvc3JjL3NsaWNlL21vZC5ycwAvcnVzdGMvNGE0ZWY0OTNlM2ExNDg4YzZlMzIxNTcwMjM4MDg0YjM4OTQ4ZjZkYi9saWJyYXJ5L2FsbG9jL3NyYy9yYXdfdmVjL21vZC5ycwAvcnVzdGMvNGE0ZWY0OTNlM2ExNDg4YzZlMzIxNTcwMjM4MDg0YjM4OTQ4ZjZkYi9saWJyYXJ5L2FsbG9jL3NyYy92ZWMvbW9kLnJzAC9ydXN0Yy80YTRlZjQ5M2UzYTE0ODhjNmUzMjE1NzAyMzgwODRiMzg5NDhmNmRiL2xpYnJhcnkvY29yZS9zcmMvbnVtL2ZsdDJkZWMvbW9kLnJzAC9yZWdpc3RyeS9zcmMvaW5kZXguY3JhdGVzLmlvLTE5NDljZjhjNmI1YjU1N2YvdnRyYWNlci0xLjAuMC1hbHBoYS40L3NyYy9mcm9udGVuZC93YXRlcnNoZWQucnMAL3J1c3QvZGVwcy9kbG1hbGxvYy0wLjIuMTEvc3JjL2RsbWFsbG9jLnJzAC9yZWdpc3RyeS9zcmMvaW5kZXguY3JhdGVzLmlvLTE5NDljZjhjNmI1YjU1N2YvdnRyYWNlci0xLjAuMC1hbHBoYS40L3NyYy9tb3NhaWMucnMAL3JlZ2lzdHJ5L3NyYy9pbmRleC5jcmF0ZXMuaW8tMTk0OWNmOGM2YjViNTU3Zi9iaXQtdmVjLTAuNi4zL3NyYy9saWIucnMAFHBpeGVsIGJ1ZmZlciBsZW5ndGggwBAgZG9lcyBub3QgbWF0Y2ggwAF4wAcgUkdCQSAowAcgYnl0ZXMpABVgYXRgIHNwbGl0IGluZGV4IChpcyDAFykgc2hvdWxkIGJlIDw9IGxlbiAoaXMgwAEpABZzd2FwX3JlbW92ZSBpbmRleCAoaXMgwBYpIHNob3VsZCBiZSA8IGxlbiAoaXMgwAEpAAk8cGF0aCBkPSLACCIgZmlsbD0iwAQiLz4KAAk8cGF0aCBkPSLABCIvPgoAPTxzdmcgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSLACiIgaGVpZ2h0PSLAAyI+CgAJPGcgZmlsbD0iwAMiPgoAAQBzdGFja2VkY3V0b3V0Y29sb3JiaW5hcnlpbWFnZSBkaW1lbnNpb25zIG92ZXJmbG93AAAADQAAAAwAAAAEAAAADgAAAA8AAAAQAEHYpMAAC20BAAAAEQAAAGEgRGlzcGxheSBpbXBs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ADgQEABSAAAAQwAAACMAAAA4EBAAUgAAAFkAAAAUAAAAIgwQAFwAAAAaAAAAMQAAABYJEABfAAAAHAEAABcAAAAAAAAA///////////4NRAAQZDswAAL8AMWCRAAXwAAAEwCAAAgAAAAFgkQAF8AAABNAgAAIQAAABYJEABfAAAAUQIAABYAAAAWCRAAXwAAAC4CAAAsAAAAFgkQAF8AAAAvAgAAGgAAABYJEABfAAAANgIAAB4AAAAWCRAAXwAAADsCAAAaAAAAFgkQAF8AAABAAgAAIAAAABYJEABfAAAAVQEAABUAAAAWCRAAXwAAAF4BAAAlAAAAFgkQAF8AAABjAQAAJQAAABYJEABfAAAAaAEAACUAAAAWCRAAXwAAAIIBAAAbAAAAFgkQAF8AAACKAQAAJQAAABYJEABfAAAAIAEAABsAAAAWCRAAXwAAAI0BAAAlAAAAFgkQAF8AAACQAQAAJQAAABYJEABfAAAAmgEAACUAAAAWCRAAXwAAANMBAAAeAAAAFgkQAF8AAAASAgAANQAAABYJEABfAAAAFwIAAC0AAAAAAAAABAAAAAQAAAALAAAAY2FsbGVkIGBSZXN1bHQ6OnVud3JhcCgpYCBvbiBhbiBgRXJyYCB2YWx1ZQAWCRAAXwAAABMCAAASAAAAFgkQAF8AAABvAgAAHAAAABYJEABfAAAAcAIAABwAAAAWCRAAXwAAAHECAAAcAAAAbwsQAFQAAACEAAAAEQAAAG8LEABUAAAAkgAAABEAAAD/////AEGM8MAACwEBAEGg8MAACwEBAEGw8MAACwj//////////wBBxPDAAAsBAQBB2PDAAAsBAQBB6PDAAAsI//////////8AQfzwwAALAQEAQZDxwAALAQEAQaDxwAALCP//////////AEG08cAACxD/////AAAAAP//////////AEH08cAACxD//////////wAAAAD/////AEGQ8sAACwj//////////wBBpPLAAAsQ/////wAAAAD//////////wBB5PLAAAsQ//////////8AAAAA/////wBBgPPAAAsZ////////////////AAAAAAEAAAABAAAAAQBBpPPAAAsYAQAAAAEAAAABAAAAAAAAAP//////////AEHG88AACxrwPwAAAAAAAPg/AAAAAAAAAAAG0M9D6/1MPgBB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';
  let ready = false;
  function ensure() { if (ready) return; const s = atob(B64), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); initSync({ module: u }); ready = true; }
  // the picture at the trace size: flat art filled to the 2048 px budget, photos at most 2×, smoothed (premultiplied by the canvas)
  function rasterizeTo(img, scale) {
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; c.getContext('2d').putImageData(img, 0, 0);
    const W = Math.max(1, Math.round(img.width * scale)), H = Math.max(1, Math.round(img.height * scale)), o = document.createElement('canvas'); o.width = W; o.height = H;
    const x = o.getContext('2d'); x.imageSmoothingEnabled = scale !== 1; x.imageSmoothingQuality = 'high'; x.drawImage(c, 0, 0, W, H); return x.getImageData(0, 0, W, H);
  }
  // profile: one of EXPORT_PROFILES (icon, balanced, detail, maxDetail, print, web, pixelExact…); options override it
  function traceImage(src, opts = {}, stage = () => {}) {
    ensure(); const started = performance.now();
    const profile = EXPORT_PROFILES[opts.profile || 'balanced'] || EXPORT_PROFILES.balanced;
    const analysis = analyzeFlatness(rasterizeTo(src, 1));
    const detected = profile.autoDetect || opts.autoDetect !== false ? (profile.autoDetect ? profileColorSettings(profile, analysis) : detectedColorSettings(analysis)) : profile;
    const settings = { ...DEFAULTS, ...profile, ...(analysis.flat && opts.autoDetect !== false ? { colors: detected.colors, speckle: detected.speckle, layerDiff: detected.layerDiff } : {}), ...opts.settings };
    if (opts.colors) settings.colors = opts.colors;
    settings.flatArt = analysis.flat;
    // as RasterTrace's app: the detected solid colours seed the colour reduction (unless the colours are fixed)
    if (opts.autoDetect !== false && analysis.solids && !settings.swatches) settings.seeds = distinctColors(analysis.solids, settings.layerDiff);
    const maxSide = MAX_TRACE_SIDE, fill = Math.max(1, maxSide / Math.max(src.width, src.height));
    const up = settings.upscale === 'auto' ? (analysis.flat ? fill : Math.min(fill, 2)) : Number(settings.upscale) || 1;
    const scale = fitTraceScale(src.width, src.height, up, maxSide);
    const img = settings.mode === 'none' ? (() => { const c = document.createElement('canvas'); c.width = src.width; c.height = src.height; c.getContext('2d').putImageData(src, 0, 0); const W = Math.round(src.width * scale), H = Math.round(src.height * scale), o = document.createElement('canvas'); o.width = W; o.height = H; const x = o.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(c, 0, 0, W, H); return x.getImageData(0, 0, W, H); })() : rasterizeTo(src, scale);
    let hasAlpha = false; for (let i = 3; i < img.data.length; i += 4) if (img.data[i] < 255) { hasAlpha = true; break; }
    if (settings.grayscale || settings.stencil) toGrayscale(img);
    if (hasAlpha) binarizeAlpha(img);
    if (settings.denoise) { stage('Denoising…'); medianFilter(img, 2); }
    const swatches = settings.stencil ? null : settings.swatches;
    const reduced = !settings.stencil && (settings.colors < 256 || Boolean(swatches && swatches.length));
    const knockedOut = reduceAndRemoveBackground(img, settings.stencil ? 256 : settings.colors, { ...settings, swatches, scale }, stage);
    if (settings.transparent) {
      if (knockedOut && settings.specks > 0) { stage('Cleaning specks…'); removeSpecks(img, tracePixels(settings.specks, scale)); }
      if (knockedOut && settings.edgeSmooth > 0) { stage('Smoothing edges…'); smoothAlpha(img, tracePixels(settings.edgeSmooth, scale)); }
      if (knockedOut && settings.edgeTrim > 0) { stage('Trimming edges…'); erodeAlpha(img, tracePixels(settings.edgeTrim, scale)); }
      if (knockedOut && settings.defringe > 0) { stage('Defringing…'); defringeAlpha(img, tracePixels(settings.defringe, scale), { keepPalette: reduced }); }
    }
    if (settings.stencil) { thresholdImage(img, settings.stencilThreshold ?? 128); fillTransparent(img, [255, 255, 255]); }
    const speckle = tracePixels(settings.speckle, scale);
    if (reduced && speckle > 1) { stage('Removing specks…'); despeckleColors(img, speckle); }
    stage('Tracing vectors…');
    const svg = trace(new Uint8Array(img.data.buffer), img.width, img.height, settings.mode, settings.hierarchical || 'stacked', settings.stencil ? 'binary' : 'color', reduced ? 0 : speckle, 8, settings.layerDiff, settings.cornerThreshold ?? 60, settings.lengthThreshold ?? 4.0, 10, settings.spliceThreshold ?? 45, settings.pathPrecision ?? 3);
    const palette = reduced ? rasterPalette(img) : null, traced = palette ? snapFills(svg, palette) : svg;
    const straightened = straightenPaths(finalizeSvg(traced, src.width, src.height), settings.straighten ?? 0);
    const finalSvg = settings.stencil ? applyStencilInk(straightened, settings.stencilInk ?? 'black') : straightened;
    const fills = [...new Set([...finalSvg.matchAll(/fill="(#[0-9a-fA-F]{6})"/g)].map((m) => m[1].toLowerCase()))];
    return { svg: finalSvg, colours: fills, flat: analysis.flat, colourCount: analysis.colorCount, scale, knockedOut, ms: Math.round(performance.now() - started), settings };
  }
  // EPS (Encapsulated PostScript), after GetVect's writer (craigjmidwinter/getvect, MIT): the traced paths as PostScript,
  // 1 pixel = 1 point (or scaled to a physical size), curves kept, nothing rasterized
  function toEps(parsed, { pageWidth, pageHeight } = {}) {
    const { width, height, paths } = parsed, pw = pageWidth ?? width, ph = pageHeight ?? height, f = (n) => String(Number(n.toFixed(3))), body = [];
    for (const path of paths) { if (path.fill === 'none') continue; const n = parseInt(path.fill.slice(1), 16); body.push(`${f(((n >> 16) & 255) / 255)} ${f(((n >> 8) & 255) / 255)} ${f((n & 255) / 255)} setrgbcolor`, 'newpath');
      for (const sub of path.subpaths) { body.push(`${f(sub.start.x)} ${f(sub.start.y)} moveto`); for (const seg of sub.segments) body.push(seg.kind === 'line' ? `${f(seg.to.x)} ${f(seg.to.y)} lineto` : `${f(seg.c1.x)} ${f(seg.c1.y)} ${f(seg.c2.x)} ${f(seg.c2.y)} ${f(seg.to.x)} ${f(seg.to.y)} curveto`); if (sub.closed) body.push('closepath'); }
      body.push('fill'); }
    return ['%!PS-Adobe-3.0 EPSF-3.0', '%%Creator: ImageCraft (RasterTrace)', '%%Title: traced artwork', `%%BoundingBox: 0 0 ${Math.ceil(pw)} ${Math.ceil(ph)}`, `%%HiResBoundingBox: 0 0 ${f(pw)} ${f(ph)}`, '%%LanguageLevel: 2', '%%Pages: 1', '%%EndComments', '%%Page: 1 1', 'gsave', `0 ${f(ph)} translate`, `${f(pw / width)} ${f(-ph / height)} scale`, ...body, 'grestore', 'showpage', '%%EOF', ''].join(String.fromCharCode(10));
  }
  window.CRAFT_RASTERTRACE = { traceImage, PROFILES: EXPORT_PROFILES, DEFAULTS, parseSvgPaths, toDxf, toPdf, toEps, applyExportOptions, parseSwatchText, parseAse, recolorSvg };

})();
