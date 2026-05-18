import struct, sys

def parse_midi(path):
    with open(path, 'rb') as f: data = f.read()
    if data[:4] != b'MThd': 
        print("Not a MIDI file"); return None, None
    hlen = struct.unpack('>I', data[4:8])[0]
    fmt, ntracks, tpqn = struct.unpack('>HHH', data[8:14])
    pos = 8 + hlen; tracks = []
    for _ in range(ntracks):
        if pos + 8 > len(data): break
        tlen = struct.unpack('>I', data[pos+4:pos+8])[0]
        pos += 8; end = pos + tlen
        events = []; name = ''; t = 0; rs = None; p = pos
        while p < end:
            delta = 0
            while p < end:
                b = data[p]; p += 1; delta = (delta << 7)|(b&0x7f)
                if not(b&0x80): break
            t += delta
            if p >= end: break
            b2 = data[p]
            if b2&0x80: rs = b2; p += 1
            else: b2 = rs
            if b2 is None: break
            mt = b2&0xf0
            if mt in(0x80,0x90) and p+1 < end: 
                note,vel=data[p],data[p+1]; p+=2
                events.append((t,mt,note,vel))
            elif mt in(0xa0,0xb0,0xe0) and p+1 < end: p+=2
            elif mt in(0xc0,0xd0) and p < end: p+=1
            elif b2==0xff and p < end:
                mtype=data[p]; p+=1; ml=0
                while p < end:
                    b3=data[p]; p+=1; ml=(ml<<7)|(b3&0x7f)
                    if not(b3&0x80): break
                if mtype==0x03 and p+ml <= end: name=data[p:p+ml].decode('latin1','replace')
                elif mtype==0x51 and p+3 <= end:
                    tempo=struct.unpack('>I',b'\x00'+data[p:p+3])[0]
                    events.append((-1,0xff,tempo,0))
                p+=ml
            elif b2 in(0xf0,0xf7):
                ml=0
                while p < end:
                    b3=data[p]; p+=1; ml=(ml<<7)|(b3&0x7f)
                    if not(b3&0x80): break
                p+=ml
            else: break
        tracks.append((name,events)); pos=end
    return tpqn, tracks

def note_name(n):
    names=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
    return names[n%12]+str(n//12-1)

def analyze(path):
    result = parse_midi(path)
    if result[0] is None: return
    tpqn, tracks = result
    print(f"TPQN: {tpqn}, Tracks: {len(tracks)}")
    
    # Find tempo
    tempo = 500000  # default 120bpm
    for name, events in tracks:
        for e in events:
            if e[0] == -1 and e[1] == 0xff:
                tempo = e[2]
                break
    bpm = round(60000000/tempo, 1)
    print(f"BPM: {bpm}")
    
    bar = tpqn * 4
    
    for i, (name, events) in enumerate(tracks):
        note_events = [(t,mt,note,vel) for t,mt,note,vel in events if mt in (0x80,0x90) and vel > 0 and t >= 0]
        if not note_events: continue
        print(f"\nTrack {i}: '{name}' ({len(note_events)} note events)")
        
        # Show first 2 bars worth of notes
        two_bar_events = [(t,note,vel) for t,mt,note,vel in note_events if t < bar*2]
        for t,note,vel in two_bar_events[:40]:
            step16 = round(t / (bar/16))
            step32 = round(t / (bar/32))
            print(f"  t={t} step16={step16} step32={step32} note={note}({note_name(note)}) vel={vel}")

analyze(sys.argv[1])
